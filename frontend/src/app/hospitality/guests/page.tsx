'use client';

/**
 * HOSPITALITY SUITE: Guests Management Page
 * 
 * View and manage hotel guests.
 * ⚠️ DEMO ONLY - All data is in-memory.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
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
  Users,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Phone,
  Mail,
  Star,
  Building2,
  Ban,
  Award,
} from 'lucide-react';

interface Guest {
  id: string;
  guestNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  guestType: string;
  companyName?: string;
  loyaltyTier?: string;
  loyaltyPoints: number;
  totalStays: number;
  totalSpent: number;
  lastVisit?: string;
  isBlacklisted: boolean;
}

interface GuestStats {
  totalGuests: number;
  individualGuests: number;
  corporateGuests: number;
  vipGuests: number;
  blacklistedGuests: number;
  totalLoyaltyPoints: number;
  byLoyaltyTier: Record<string, number>;
}

const GUEST_TYPES: Record<string, { name: string; icon: any }> = {
  INDIVIDUAL: { name: 'Individual', icon: Users },
  CORPORATE: { name: 'Corporate', icon: Building2 },
  GROUP: { name: 'Group', icon: Users },
  VIP: { name: 'VIP', icon: Star },
};

const LOYALTY_TIERS: Record<string, { name: string; color: string }> = {
  BRONZE: { name: 'Bronze', color: 'bg-amber-100 text-amber-700' },
  SILVER: { name: 'Silver', color: 'bg-slate-100 text-slate-700' },
  GOLD: { name: 'Gold', color: 'bg-yellow-100 text-yellow-700' },
  PLATINUM: { name: 'Platinum', color: 'bg-purple-100 text-purple-700' },
};

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<GuestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLoyalty, setFilterLoyalty] = useState<string>('all');

  useEffect(() => {
    fetchGuests();
  }, [filterType, filterLoyalty]);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('guestType', filterType);
      }
      if (filterLoyalty !== 'all') {
        params.append('loyaltyTier', filterLoyalty);
      }
      const response = await fetch(`/api/hospitality/guests?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setGuests(data.guests);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load guests');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchGuests();
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`/api/hospitality/guests?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (data.success) {
        setGuests(data.guests);
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredGuests = guests.filter(guest => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        guest.firstName.toLowerCase().includes(search) ||
        guest.lastName.toLowerCase().includes(search) ||
        guest.phone.includes(search) ||
        guest.email?.toLowerCase().includes(search) ||
        guest.guestNumber.toLowerCase().includes(search)
      );
    }
    return true;
  });

  if (loading && guests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-slate-600">Loading guests...</p>
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
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Guests</h1>
                  <p className="text-xs text-slate-500">{stats?.totalGuests || 0} registered guests</p>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats?.totalGuests || 0}</p>
              <p className="text-xs text-slate-500">Total Guests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats?.vipGuests || 0}</p>
              <p className="text-xs text-slate-500">VIP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats?.corporateGuests || 0}</p>
              <p className="text-xs text-slate-500">Corporate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats?.byLoyaltyTier?.GOLD || 0}</p>
              <p className="text-xs text-slate-500">Gold Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats?.blacklistedGuests || 0}</p>
              <p className="text-xs text-slate-500">Blacklisted</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              data-testid="search-guest"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40" data-testid="filter-type">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Guest Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(GUEST_TYPES).map(([key, { name }]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterLoyalty} onValueChange={setFilterLoyalty}>
            <SelectTrigger className="w-40" data-testid="filter-loyalty">
              <Award className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Loyalty Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              {Object.entries(LOYALTY_TIERS).map(([key, { name }]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Guests Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Loyalty</TableHead>
                  <TableHead>Stays</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.map((guest) => (
                  <TableRow 
                    key={guest.id} 
                    className={guest.isBlacklisted ? 'bg-red-50' : ''}
                    data-testid={`guest-${guest.guestNumber}`}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {guest.firstName} {guest.lastName}
                          {guest.guestType === 'VIP' && (
                            <Star className="inline h-4 w-4 text-amber-500 ml-1" />
                          )}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">{guest.guestNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" /> {guest.phone}
                        </p>
                        {guest.email && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-400" /> {guest.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {GUEST_TYPES[guest.guestType]?.name || guest.guestType}
                      </Badge>
                      {guest.companyName && (
                        <p className="text-xs text-slate-500 mt-1">{guest.companyName}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {guest.loyaltyTier ? (
                        <div>
                          <Badge className={LOYALTY_TIERS[guest.loyaltyTier]?.color || 'bg-slate-100'}>
                            {LOYALTY_TIERS[guest.loyaltyTier]?.name || guest.loyaltyTier}
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">{guest.loyaltyPoints.toLocaleString()} pts</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{guest.totalStays}</p>
                      {guest.lastVisit && (
                        <p className="text-xs text-slate-500">Last: {guest.lastVisit}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{formatNaira(guest.totalSpent)}</p>
                    </TableCell>
                    <TableCell>
                      {guest.isBlacklisted ? (
                        <Badge className="bg-red-100 text-red-700">
                          <Ban className="h-3 w-3 mr-1" /> Blacklisted
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {filteredGuests.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No guests found</p>
          </div>
        )}
      </main>
    </div>
  );
}
