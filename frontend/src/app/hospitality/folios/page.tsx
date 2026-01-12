'use client';

/**
 * HOSPITALITY SUITE: Guest Folios Page
 * 
 * View and manage guest folios and charges.
 * ⚠️ DEMO ONLY - All data is in-memory.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Receipt,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Filter,
  Eye,
  BedDouble,
  CreditCard,
  Plus,
  Minus,
} from 'lucide-react';

interface FolioCharge {
  id: string;
  chargeType: string;
  description: string;
  amount: number;
  quantity: number;
  total: number;
  date: string;
  postedBy: string;
}

interface Folio {
  id: string;
  reservationId: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  charges: FolioCharge[];
  totalCharges: number;
  totalPayments: number;
  balance: number;
  status: string;
}

interface FolioStats {
  totalFolios: number;
  openFolios: number;
  settledFolios: number;
  totalRevenue: number;
  totalCharges: number;
  totalPayments: number;
  outstandingBalance: number;
}

const FOLIO_STATUS: Record<string, { name: string; color: string }> = {
  OPEN: { name: 'Open', color: 'bg-blue-100 text-blue-700' },
  SETTLED: { name: 'Settled', color: 'bg-green-100 text-green-700' },
  CLOSED: { name: 'Closed', color: 'bg-gray-100 text-gray-700' },
};

const CHARGE_TYPES: Record<string, { name: string }> = {
  ROOM: { name: 'Room' },
  FB_RESTAURANT: { name: 'Restaurant' },
  FB_BAR: { name: 'Bar' },
  FB_ROOM_SERVICE: { name: 'Room Service' },
  MINIBAR: { name: 'Minibar' },
  LAUNDRY: { name: 'Laundry' },
  SPA: { name: 'Spa' },
  PARKING: { name: 'Parking' },
  DEPOSIT: { name: 'Deposit' },
  PAYMENT: { name: 'Payment' },
  REFUND: { name: 'Refund' },
};

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
  });
}

export default function FoliosPage() {
  const [folios, setFolios] = useState<Folio[]>([]);
  const [stats, setStats] = useState<FolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedFolio, setSelectedFolio] = useState<Folio | null>(null);

  useEffect(() => {
    fetchFolios();
  }, [filterStatus]);

  const fetchFolios = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      const response = await fetch(`/api/hospitality/folio?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setFolios(data.folios);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load folios');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (loading && folios.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-slate-600">Loading folios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/hospitality/admin">
                <Button variant="ghost" size="sm" data-testid="back-btn">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Receipt className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Guest Folios</h1>
                  <p className="text-xs text-slate-500">{stats?.totalFolios || 0} total folios</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              DEMO MODE
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats?.openFolios || 0}</p>
              <p className="text-xs text-slate-500">Open</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats?.settledFolios || 0}</p>
              <p className="text-xs text-slate-500">Settled</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-lg font-bold text-amber-600">{formatNaira(stats?.outstandingBalance || 0)}</p>
              <p className="text-xs text-slate-500">Outstanding</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-lg font-bold text-teal-600">{formatNaira(stats?.totalRevenue || 0)}</p>
              <p className="text-xs text-slate-500">Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48" data-testid="filter-status">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folios</SelectItem>
              {Object.entries(FOLIO_STATUS).map(([key, { name }]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Folios Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Charges</TableHead>
                  <TableHead>Payments</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {folios.map((folio) => (
                  <TableRow key={folio.id} data-testid={`folio-${folio.id}`}>
                    <TableCell>
                      <p className="font-medium">{folio.guestName}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-slate-400" />
                        <span>{folio.roomNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {formatDate(folio.checkInDate)} - {formatDate(folio.checkOutDate)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{formatNaira(folio.totalCharges)}</p>
                      <p className="text-xs text-slate-500">{folio.charges.length} items</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-green-600">{formatNaira(folio.totalPayments)}</p>
                    </TableCell>
                    <TableCell>
                      <p className={`font-bold ${
                        folio.balance > 0 ? 'text-amber-600' : 
                        folio.balance < 0 ? 'text-green-600' : 'text-slate-600'
                      }`}>
                        {formatNaira(folio.balance)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className={FOLIO_STATUS[folio.status]?.color || 'bg-slate-100'}>
                        {FOLIO_STATUS[folio.status]?.name || folio.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedFolio(folio)}
                            data-testid={`view-${folio.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Folio Details - {folio.guestName}</DialogTitle>
                            <DialogDescription>
                              Room {folio.roomNumber} • {formatDate(folio.checkInDate)} - {formatDate(folio.checkOutDate)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="p-3 bg-slate-50 rounded-lg text-center">
                                <p className="text-sm text-slate-500">Charges</p>
                                <p className="text-lg font-bold">{formatNaira(folio.totalCharges)}</p>
                              </div>
                              <div className="p-3 bg-green-50 rounded-lg text-center">
                                <p className="text-sm text-slate-500">Payments</p>
                                <p className="text-lg font-bold text-green-600">{formatNaira(folio.totalPayments)}</p>
                              </div>
                              <div className={`p-3 rounded-lg text-center ${
                                folio.balance > 0 ? 'bg-amber-50' : 'bg-green-50'
                              }`}>
                                <p className="text-sm text-slate-500">Balance</p>
                                <p className={`text-lg font-bold ${
                                  folio.balance > 0 ? 'text-amber-600' : 'text-green-600'
                                }`}>{formatNaira(folio.balance)}</p>
                              </div>
                            </div>
                            
                            {/* Charges List */}
                            <div>
                              <h4 className="font-medium mb-2">Transactions</h4>
                              <div className="border rounded-lg divide-y">
                                {folio.charges.map((charge) => (
                                  <div key={charge.id} className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {charge.total < 0 ? (
                                        <div className="p-1.5 bg-green-100 rounded">
                                          <Minus className="h-4 w-4 text-green-600" />
                                        </div>
                                      ) : (
                                        <div className="p-1.5 bg-slate-100 rounded">
                                          <Plus className="h-4 w-4 text-slate-600" />
                                        </div>
                                      )}
                                      <div>
                                        <p className="font-medium text-sm">{charge.description}</p>
                                        <p className="text-xs text-slate-500">
                                          {CHARGE_TYPES[charge.chargeType]?.name || charge.chargeType} • {charge.date}
                                        </p>
                                      </div>
                                    </div>
                                    <p className={`font-medium ${charge.total < 0 ? 'text-green-600' : ''}`}>
                                      {formatNaira(charge.total)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {folios.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No folios match your filters</p>
          </div>
        )}
      </main>
    </div>
  );
}
