/**
 * ADVANCED WAREHOUSE SUITE — Dashboard
 * Phase 7C.3, S5 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Warehouse, 
  Package, 
  Boxes, 
  ClipboardList, 
  Truck, 
  ArrowLeftRight,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Demo data for Nigerian warehouses
const WAREHOUSES = [
  { id: 'wh-lagos', name: 'Lagos Main Warehouse', code: 'WH-LAGOS-01', location: 'Victoria Island, Lagos', type: 'DISTRIBUTION' },
  { id: 'wh-ibadan', name: 'Ibadan Regional Depot', code: 'WH-IBD-01', location: 'Dugbe, Ibadan', type: 'REGIONAL' },
  { id: 'wh-abuja', name: 'Abuja Distribution Center', code: 'WH-ABJ-01', location: 'Garki, Abuja', type: 'DISTRIBUTION' },
];

const DASHBOARD_DATA = {
  'wh-lagos': {
    zones: { total: 8, receiving: 1, storage: 4, picking: 2, shipping: 1 },
    bins: { total: 120, empty: 28, occupied: 89, blocked: 3 },
    receipts: { expected: 4, receiving: 2, completed: 12 },
    putaway: { pending: 8, inProgress: 3, completedToday: 15 },
    picking: { pending: 6, inProgress: 4, packed: 3, dispatched: 22 },
    batches: { expiringSoon: 5, expired: 1 },
    todayMovements: { receipts: 45, picks: 67, adjustments: 3 },
  },
  'wh-ibadan': {
    zones: { total: 5, receiving: 1, storage: 2, picking: 1, shipping: 1 },
    bins: { total: 60, empty: 18, occupied: 40, blocked: 2 },
    receipts: { expected: 2, receiving: 1, completed: 8 },
    putaway: { pending: 4, inProgress: 2, completedToday: 9 },
    picking: { pending: 3, inProgress: 2, packed: 1, dispatched: 14 },
    batches: { expiringSoon: 3, expired: 0 },
    todayMovements: { receipts: 22, picks: 34, adjustments: 1 },
  },
  'wh-abuja': {
    zones: { total: 6, receiving: 1, storage: 3, picking: 1, shipping: 1 },
    bins: { total: 80, empty: 22, occupied: 56, blocked: 2 },
    receipts: { expected: 3, receiving: 1, completed: 10 },
    putaway: { pending: 5, inProgress: 2, completedToday: 11 },
    picking: { pending: 4, inProgress: 3, packed: 2, dispatched: 18 },
    batches: { expiringSoon: 4, expired: 0 },
    todayMovements: { receipts: 33, picks: 48, adjustments: 2 },
  },
};

const EXPIRING_BATCHES = [
  { id: '1', product: 'Paracetamol 500mg', batch: 'PARA-2026-001', expiry: '2026-01-20', qty: 5000, daysLeft: 14 },
  { id: '2', product: 'Amoxicillin Capsules', batch: 'AMOX-2025-089', expiry: '2026-01-25', qty: 2000, daysLeft: 19 },
  { id: '3', product: 'Vitamin C Tablets', batch: 'VITC-2025-112', expiry: '2026-02-05', qty: 8000, daysLeft: 30 },
  { id: '4', product: 'Oral Rehydration Salts', batch: 'ORS-2026-015', expiry: '2026-01-28', qty: 3500, daysLeft: 22 },
  { id: '5', product: 'Ibuprofen 400mg', batch: 'IBU-2025-203', expiry: '2026-02-10', qty: 4200, daysLeft: 35 },
];

const RECENT_ACTIVITY = [
  { id: '1', type: 'receipt', desc: 'GRN-202601-0045 received from Prime Pharma', time: '10 mins ago', status: 'success' },
  { id: '2', type: 'pick', desc: 'PICK-202601-0089 dispatched to Shoprite VI', time: '25 mins ago', status: 'success' },
  { id: '3', type: 'putaway', desc: 'PUT-202601-0067 completed - Zone STG-B', time: '40 mins ago', status: 'success' },
  { id: '4', type: 'alert', desc: 'Bin A-03-02-04 blocked for inspection', time: '1 hour ago', status: 'warning' },
  { id: '5', type: 'receipt', desc: 'GRN-202601-0044 inspection passed', time: '2 hours ago', status: 'success' },
];

export default function AdvancedWarehouseDashboard() {
  const [selectedWarehouse, setSelectedWarehouse] = useState('wh-lagos');
  const warehouse = WAREHOUSES.find((w: any) => w.id === selectedWarehouse)!;
  const data = DASHBOARD_DATA[selectedWarehouse as keyof typeof DASHBOARD_DATA];
  const occupancyRate = Math.round((data.bins.occupied / data.bins.total) * 100);

  return (
    <div className="space-y-6" data-testid="warehouse-dashboard">
      {/* Warehouse Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Warehouse Dashboard
          </h2>
          <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {warehouse.location}
          </p>
        </div>
        <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
          <SelectTrigger className="w-full md:w-64" data-testid="warehouse-selector">
            <Warehouse className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select warehouse" />
          </SelectTrigger>
          <SelectContent>
            {WAREHOUSES.map(wh => (
              <SelectItem key={wh.id} value={wh.id}>
                {wh.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Zones</p>
                <p className="text-2xl font-bold">{data.zones.total}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Warehouse className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Bin Occupancy</p>
                <p className="text-2xl font-bold">{occupancyRate}%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <Progress value={occupancyRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Tasks</p>
                <p className="text-2xl font-bold">{data.putaway.pending + data.picking.pending}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <ClipboardList className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Dispatched Today</p>
                <p className="text-2xl font-bold">{data.picking.dispatched}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Truck className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { href: '/advanced-warehouse-suite/zones', icon: Warehouse, label: 'Zones & Bins', count: data.zones.total, color: 'bg-amber-500' },
          { href: '/advanced-warehouse-suite/batches', icon: Package, label: 'Batches', count: data.batches.expiringSoon, color: 'bg-purple-500', alert: true },
          { href: '/advanced-warehouse-suite/receipts', icon: Boxes, label: 'Receipts', count: data.receipts.expected + data.receipts.receiving, color: 'bg-blue-500' },
          { href: '/advanced-warehouse-suite/pick-lists', icon: ClipboardList, label: 'Pick Lists', count: data.picking.pending + data.picking.inProgress, color: 'bg-green-500' },
          { href: '/advanced-warehouse-suite/movements', icon: ArrowLeftRight, label: 'Movements', count: data.todayMovements.receipts + data.todayMovements.picks, color: 'bg-gray-500' },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`${link.color} text-white p-3 rounded-lg mb-2`}>
                  <link.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{link.label}</span>
                <span className={`text-lg font-bold ${link.alert ? 'text-orange-600' : ''}`}>
                  {link.count}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Operations Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Operations Summary</CardTitle>
            <CardDescription>Current workflow status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Receiving */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Receiving</span>
                <span>{data.receipts.expected} expected, {data.receipts.receiving} in progress</span>
              </div>
              <div className="flex gap-1">
                <div className="h-2 bg-yellow-400 rounded" style={{ width: `${(data.receipts.expected / 10) * 100}%` }} />
                <div className="h-2 bg-blue-400 rounded" style={{ width: `${(data.receipts.receiving / 10) * 100}%` }} />
                <div className="h-2 bg-green-400 rounded" style={{ width: `${(data.receipts.completed / 20) * 100}%` }} />
              </div>
            </div>
            
            {/* Putaway */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Putaway</span>
                <span>{data.putaway.pending} pending, {data.putaway.completedToday} done today</span>
              </div>
              <div className="flex gap-1">
                <div className="h-2 bg-orange-400 rounded" style={{ width: `${(data.putaway.pending / 15) * 100}%` }} />
                <div className="h-2 bg-blue-400 rounded" style={{ width: `${(data.putaway.inProgress / 15) * 100}%` }} />
                <div className="h-2 bg-green-400 rounded" style={{ width: `${(data.putaway.completedToday / 20) * 100}%` }} />
              </div>
            </div>
            
            {/* Picking */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Picking & Dispatch</span>
                <span>{data.picking.pending + data.picking.inProgress} active, {data.picking.dispatched} shipped</span>
              </div>
              <div className="flex gap-1">
                <div className="h-2 bg-orange-400 rounded" style={{ width: `${(data.picking.pending / 15) * 100}%` }} />
                <div className="h-2 bg-blue-400 rounded" style={{ width: `${(data.picking.inProgress / 15) * 100}%` }} />
                <div className="h-2 bg-purple-400 rounded" style={{ width: `${(data.picking.packed / 15) * 100}%` }} />
                <div className="h-2 bg-green-400 rounded" style={{ width: `${(data.picking.dispatched / 30) * 100}%` }} />
              </div>
            </div>

            {/* Today's Movements */}
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-500 mb-2">Today's Movements</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-blue-50 rounded">
                  <p className="text-lg font-bold text-blue-600">{data.todayMovements.receipts}</p>
                  <p className="text-xs text-gray-500">Receipts</p>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <p className="text-lg font-bold text-green-600">{data.todayMovements.picks}</p>
                  <p className="text-xs text-gray-500">Picks</p>
                </div>
                <div className="p-2 bg-orange-50 rounded">
                  <p className="text-lg font-bold text-orange-600">{data.todayMovements.adjustments}</p>
                  <p className="text-xs text-gray-500">Adjustments</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expiring Batches */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Expiring Soon
                </CardTitle>
                <CardDescription>Batches expiring within 30 days</CardDescription>
              </div>
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                {data.batches.expiringSoon} batches
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {EXPIRING_BATCHES.slice(0, 5).map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{batch.product}</p>
                    <p className="text-xs text-gray-500">{batch.batch} • {batch.qty.toLocaleString()} units</p>
                  </div>
                  <Badge 
                    variant={batch.daysLeft <= 14 ? 'destructive' : 'outline'}
                    className={batch.daysLeft <= 14 ? '' : 'text-orange-600 border-orange-300'}
                  >
                    {batch.daysLeft} days
                  </Badge>
                </div>
              ))}
            </div>
            <Link href="/advanced-warehouse-suite/batches?filter=expiring" className="block mt-4 text-sm text-amber-600 hover:underline text-center">
              View all expiring batches →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Latest warehouse operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                <div className={`p-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  {activity.status === 'success' ? (
                    <CheckCircle className={`h-4 w-4 ${activity.status === 'success' ? 'text-green-600' : 'text-orange-600'}`} />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.desc}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
