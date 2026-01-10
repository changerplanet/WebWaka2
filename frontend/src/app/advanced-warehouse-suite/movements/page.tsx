/**
 * ADVANCED WAREHOUSE SUITE — Stock Movements Page
 * Phase 7C.3, S5 Admin UI
 * Complete audit trail of all stock movements
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftRight, 
  Search, 
  Filter,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Package,
  Boxes,
  ClipboardList,
  Truck,
  AlertTriangle,
  Download,
  Calendar,
  MoreHorizontal,
  Eye
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Demo movements data - Nigerian warehouse context
const DEMO_MOVEMENTS = [
  { 
    id: '1', 
    movementNumber: 'MOV-202601-0145',
    warehouseName: 'Lagos Main Warehouse',
    movementType: 'RECEIPT',
    productName: 'Paracetamol 500mg Tablets',
    sku: 'PARA-500-100',
    batchNumber: 'PARA-2026-005',
    quantity: 5000,
    beforeQuantity: 3000,
    afterQuantity: 8000,
    fromBin: null,
    toBin: 'RCV-01-01',
    unitCostNGN: 25,
    referenceType: 'GRN',
    referenceNumber: 'GRN-202601-0045',
    reasonCode: null,
    performedBy: 'Adamu Musa',
    performedAt: '2026-01-06T10:30:00Z',
    notes: 'Received from Prime Pharma Ltd',
  },
  { 
    id: '2', 
    movementNumber: 'MOV-202601-0144',
    warehouseName: 'Lagos Main Warehouse',
    movementType: 'PUTAWAY',
    productName: 'Ibuprofen 400mg Tablets',
    sku: 'IBU-400-100',
    batchNumber: 'IBU-2026-012',
    quantity: 3000,
    beforeQuantity: 3000,
    afterQuantity: 3000,
    fromBin: 'RCV-01-02',
    toBin: 'A-02-03-02',
    unitCostNGN: 35,
    referenceType: 'PUT',
    referenceNumber: 'PUT-202601-0068',
    reasonCode: null,
    performedBy: 'Adamu Musa',
    performedAt: '2026-01-06T10:15:00Z',
    notes: null,
  },
  { 
    id: '3', 
    movementNumber: 'MOV-202601-0143',
    warehouseName: 'Lagos Main Warehouse',
    movementType: 'PICK',
    productName: 'Amoxicillin Capsules 500mg',
    sku: 'AMOX-500-50',
    batchNumber: 'AMOX-2025-089',
    quantity: -200,
    beforeQuantity: 2000,
    afterQuantity: 1800,
    fromBin: 'A-01-01-02',
    toBin: 'PCK-01-01',
    unitCostNGN: 85,
    referenceType: 'PICK',
    referenceNumber: 'PICK-202601-0088',
    reasonCode: null,
    performedBy: 'Emeka Obi',
    performedAt: '2026-01-06T09:45:00Z',
    notes: 'Order: ORD-2026-1244 - MedPlus Pharmacy Ikeja',
  },
  { 
    id: '4', 
    movementNumber: 'MOV-202601-0142',
    warehouseName: 'Lagos Main Warehouse',
    movementType: 'TRANSFER_OUT',
    productName: 'Vitamin C 1000mg Tablets',
    sku: 'VITC-1000-60',
    batchNumber: 'VITC-2025-112',
    quantity: -500,
    beforeQuantity: 8000,
    afterQuantity: 7500,
    fromBin: 'A-03-02-01',
    toBin: null,
    unitCostNGN: 45,
    referenceType: 'TRF',
    referenceNumber: 'TRF-2026-0015',
    reasonCode: null,
    performedBy: 'Chidi Okoro',
    performedAt: '2026-01-06T09:30:00Z',
    notes: 'Transfer to Ibadan Regional Depot',
  },
  { 
    id: '5', 
    movementNumber: 'MOV-202601-0141',
    warehouseName: 'Lagos Main Warehouse',
    movementType: 'ADJUSTMENT',
    productName: 'Oral Rehydration Salts (ORS)',
    sku: 'ORS-20G-50',
    batchNumber: 'ORS-2026-015',
    quantity: -50,
    beforeQuantity: 3550,
    afterQuantity: 3500,
    fromBin: 'B-01-02-03',
    toBin: null,
    unitCostNGN: 120,
    referenceType: 'ADJ',
    referenceNumber: 'ADJ-202601-0012',
    reasonCode: 'DAMAGE',
    performedBy: 'Ngozi Eze',
    performedAt: '2026-01-06T09:00:00Z',
    notes: 'Damaged during handling - supervisor approved',
  },
  { 
    id: '6', 
    movementNumber: 'MOV-202601-0140',
    warehouseName: 'Lagos Main Warehouse',
    movementType: 'RELOCATION',
    productName: 'Insulin Vials 100IU/ml',
    sku: 'INS-100-10',
    batchNumber: 'INS-2025-045',
    quantity: 50,
    beforeQuantity: 50,
    afterQuantity: 50,
    fromBin: 'C-01-01-01',
    toBin: 'C-01-02-01',
    unitCostNGN: 8500,
    referenceType: 'REL',
    referenceNumber: 'REL-202601-0008',
    reasonCode: 'OPTIMIZATION',
    performedBy: 'Chidi Okoro',
    performedAt: '2026-01-06T08:30:00Z',
    notes: 'Moved to better temperature-controlled bin',
  },
  { 
    id: '7', 
    movementNumber: 'MOV-202601-0139',
    warehouseName: 'Lagos Main Warehouse',
    movementType: 'SCRAP',
    productName: 'Metformin 500mg Tablets',
    sku: 'MET-500-100',
    batchNumber: 'MET-2025-089',
    quantity: -800,
    beforeQuantity: 800,
    afterQuantity: 0,
    fromBin: 'QTN-01-03',
    toBin: null,
    unitCostNGN: 30,
    referenceType: 'SCR',
    referenceNumber: 'SCR-202601-0003',
    reasonCode: 'EXPIRED',
    performedBy: 'Ngozi Eze',
    performedAt: '2026-01-05T16:00:00Z',
    notes: 'Expired batch - sent for destruction',
  },
  { 
    id: '8', 
    movementNumber: 'MOV-202601-0138',
    warehouseName: 'Ibadan Regional Depot',
    movementType: 'TRANSFER_IN',
    productName: 'Artemether-Lumefantrine Tabs',
    sku: 'ART-LUM-24',
    batchNumber: 'ART-2025-045',
    quantity: 1000,
    beforeQuantity: 500,
    afterQuantity: 1500,
    fromBin: null,
    toBin: 'STG-A-01-01',
    unitCostNGN: 450,
    referenceType: 'TRF',
    referenceNumber: 'TRF-2026-0014',
    reasonCode: null,
    performedBy: 'Tunde Abiola',
    performedAt: '2026-01-05T14:00:00Z',
    notes: 'Received from Lagos Main Warehouse',
  },
];

const MOVEMENT_TYPE_CONFIG: Record<string, { color: string; icon: typeof ArrowDown; label: string }> = {
  RECEIPT: { color: 'bg-green-100 text-green-700', icon: ArrowDown, label: 'Receipt' },
  PUTAWAY: { color: 'bg-blue-100 text-blue-700', icon: Package, label: 'Putaway' },
  PICK: { color: 'bg-purple-100 text-purple-700', icon: ClipboardList, label: 'Pick' },
  TRANSFER_OUT: { color: 'bg-orange-100 text-orange-700', icon: ArrowUp, label: 'Transfer Out' },
  TRANSFER_IN: { color: 'bg-cyan-100 text-cyan-700', icon: ArrowDown, label: 'Transfer In' },
  ADJUSTMENT: { color: 'bg-yellow-100 text-yellow-700', icon: RefreshCw, label: 'Adjustment' },
  RELOCATION: { color: 'bg-indigo-100 text-indigo-700', icon: ArrowLeftRight, label: 'Relocation' },
  SCRAP: { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Scrap' },
};

export default function MovementsPage() {
  const [movements] = useState(DEMO_MOVEMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');

  // Filter movements
  const filteredMovements = movements.filter(mov => {
    const matchesSearch = !searchQuery || 
      mov.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mov.movementNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mov.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mov.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || mov.movementType === typeFilter;
    const matchesWarehouse = warehouseFilter === 'all' || mov.warehouseName.includes(warehouseFilter);
    return matchesSearch && matchesType && matchesWarehouse;
  });

  // Stats
  const todayReceipts = movements.filter((m: any) => m.movementType === 'RECEIPT').reduce((sum: any, m: any) => sum + m.quantity, 0);
  const todayPicks = movements.filter((m: any) => m.movementType === 'PICK').reduce((sum: any, m: any) => sum + Math.abs(m.quantity), 0);
  const todayAdjustments = movements.filter((m: any) => ['ADJUSTMENT', 'SCRAP'].includes(m.movementType)).length;
  const totalValueMoved = movements.reduce((sum: any, m: any) => sum + (Math.abs(m.quantity) * m.unitCostNGN), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-NG', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6" data-testid="movements-page">
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
              <ArrowLeftRight className="h-6 w-6 text-gray-600" />
              Stock Movements
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Complete audit trail of all inventory movements
            </p>
          </div>
        </div>
        <Button variant="outline" data-testid="export-movements-btn">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ArrowDown className="h-6 w-6 mx-auto mb-1 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{todayReceipts.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Units Received</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ArrowUp className="h-6 w-6 mx-auto mb-1 text-purple-600" />
            <div className="text-2xl font-bold text-purple-600">{todayPicks.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Units Picked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <RefreshCw className="h-6 w-6 mx-auto mb-1 text-yellow-600" />
            <div className="text-2xl font-bold text-yellow-600">{todayAdjustments}</div>
            <div className="text-sm text-gray-500">Adjustments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Truck className="h-6 w-6 mx-auto mb-1 text-blue-600" />
            <div className="text-lg font-bold text-blue-600">{formatCurrency(totalValueMoved)}</div>
            <div className="text-sm text-gray-500">Value Moved</div>
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
                placeholder="Search by product, batch, SKU, movement #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-movements"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-44" data-testid="filter-movement-type">
                <SelectValue placeholder="Movement Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="RECEIPT">Receipt</SelectItem>
                <SelectItem value="PUTAWAY">Putaway</SelectItem>
                <SelectItem value="PICK">Pick</SelectItem>
                <SelectItem value="TRANSFER_OUT">Transfer Out</SelectItem>
                <SelectItem value="TRANSFER_IN">Transfer In</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                <SelectItem value="RELOCATION">Relocation</SelectItem>
                <SelectItem value="SCRAP">Scrap</SelectItem>
              </SelectContent>
            </Select>
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="w-full md:w-44" data-testid="filter-warehouse">
                <SelectValue placeholder="Warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                <SelectItem value="Lagos">Lagos Main</SelectItem>
                <SelectItem value="Ibadan">Ibadan</SelectItem>
                <SelectItem value="Abuja">Abuja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Movement</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product / Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">By / When</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMovements.map((mov) => {
                  const typeConfig = MOVEMENT_TYPE_CONFIG[mov.movementType];
                  const TypeIcon = typeConfig?.icon || ArrowLeftRight;
                  const isNegative = mov.quantity < 0;
                  
                  return (
                    <tr key={mov.id} className="hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`movement-row-${mov.id}`}>
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm">{mov.movementNumber}</div>
                        <div className="text-xs text-gray-500">{mov.warehouseName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{mov.productName}</div>
                        <div className="text-xs text-gray-500">{mov.sku} • {mov.batchNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${typeConfig?.color} flex items-center gap-1 w-fit`}>
                          <TypeIcon className="h-3 w-3" />
                          {typeConfig?.label}
                        </Badge>
                        {mov.reasonCode && (
                          <div className="text-xs text-gray-500 mt-1">{mov.reasonCode}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className={`font-medium ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                          {isNegative ? '' : '+'}{mov.quantity.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {mov.beforeQuantity.toLocaleString()} → {mov.afterQuantity.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {mov.fromBin && (
                            <span className="text-gray-500">From: <span className="font-mono">{mov.fromBin}</span></span>
                          )}
                        </div>
                        <div className="text-sm">
                          {mov.toBin && (
                            <span className="text-gray-500">To: <span className="font-mono">{mov.toBin}</span></span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-mono">{mov.referenceNumber}</div>
                        <div className="text-xs text-gray-500">{mov.referenceType}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{mov.performedBy}</div>
                        <div className="text-xs text-gray-500">{formatDateTime(mov.performedAt)}</div>
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

      {filteredMovements.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ArrowLeftRight className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No movements found</h3>
            <p className="text-gray-500">Try adjusting your filters or date range</p>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Movement Types Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(MOVEMENT_TYPE_CONFIG).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <Badge key={type} className={`${config.color} flex items-center gap-1`}>
                  <Icon className="h-3 w-3" />
                  {config.label}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
