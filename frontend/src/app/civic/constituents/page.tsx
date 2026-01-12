'use client';

/**
 * CIVIC SUITE: Constituents/Members Page
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Plus,
  ArrowLeft,
  MoreVertical,
  UserCheck,
  UserX,
  Phone,
  Home,
} from 'lucide-react';
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

interface Constituent {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  membershipType: string;
  membershipStatus: string;
  ward?: string;
  zone?: string;
  propertyAddress?: string;
  totalContributions: number;
  outstandingBalance: number;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
};

const TYPE_LABELS: Record<string, string> = {
  RESIDENT: 'Resident',
  LANDLORD: 'Landlord',
  TENANT: 'Tenant',
  BUSINESS: 'Business',
  HONORARY: 'Honorary',
  ASSOCIATE: 'Associate',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function ConstituentsPage() {
  const [constituents, setConstituents] = useState<Constituent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchConstituents();
  }, [search, statusFilter, typeFilter]);

  async function fetchConstituents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      
      const response = await fetch(`/api/civic/constituents?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setConstituents(data.constituents);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch constituents:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const response = await fetch('/api/civic/constituents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-status', id, status }),
      });
      
      if (response.ok) {
        fetchConstituents();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto" data-testid="civic-constituents-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/civic/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Members</h1>
            <p className="text-gray-500">Manage organization members</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold">{stats.totalConstituents}</div>
            <p className="text-sm text-gray-500">Total Members</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-green-600">{stats.activeConstituents}</div>
            <p className="text-sm text-gray-500">Active</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</div>
            <p className="text-sm text-gray-500">Pending Approval</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-red-600">{stats.suspendedConstituents}</div>
            <p className="text-sm text-gray-500">Suspended</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, phone, or member number..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="LANDLORD">Landlord</SelectItem>
              <SelectItem value="RESIDENT">Resident</SelectItem>
              <SelectItem value="TENANT">Tenant</SelectItem>
              <SelectItem value="BUSINESS">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({constituents.length})
          </h2>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading members...</p>
            </div>
          ) : constituents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No members found matching your criteria.
            </div>
          ) : (
            <div className="divide-y">
              {constituents.map((member) => (
                <div key={member.id} className="py-4 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-700 font-semibold">
                        {member.firstName[0]}{member.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.firstName} {member.lastName}</p>
                        <Badge variant="outline" className={STATUS_COLORS[member.membershipStatus]}>
                          {member.membershipStatus}
                        </Badge>
                        <Badge variant="secondary">
                          {TYPE_LABELS[member.membershipType] || member.membershipType}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{member.memberNumber}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </span>
                        {member.ward && (
                          <span className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            {member.ward}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(member.totalContributions)}
                      </p>
                      <p className="text-xs text-gray-500">Total Contributions</p>
                      {member.outstandingBalance > 0 && (
                        <p className="text-xs text-red-500">
                          {formatCurrency(member.outstandingBalance)} outstanding
                        </p>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          View Dues
                        </DropdownMenuItem>
                        {member.membershipStatus === 'PENDING' && (
                          <DropdownMenuItem onClick={() => updateStatus(member.id, 'ACTIVE')}>
                            <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                            Approve
                          </DropdownMenuItem>
                        )}
                        {member.membershipStatus === 'ACTIVE' && (
                          <DropdownMenuItem 
                            onClick={() => updateStatus(member.id, 'SUSPENDED')}
                            className="text-red-600"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                        {member.membershipStatus === 'SUSPENDED' && (
                          <DropdownMenuItem onClick={() => updateStatus(member.id, 'ACTIVE')}>
                            <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                            Reinstate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
