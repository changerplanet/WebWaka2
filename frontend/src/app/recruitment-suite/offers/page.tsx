/**
 * RECRUITMENT & ONBOARDING SUITE — Offers Page
 * Phase 7C.1, S5 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  FileCheck, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  User
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Offer {
  id: string;
  applicantName: string;
  jobTitle: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  totalCompensation: number;
  startDate: string;
  status: string;
  sentAt: string | null;
  expiresAt: string | null;
  notes: string | null;
}

const DEMO_OFFERS: Offer[] = [
  {
    id: '1',
    applicantName: 'Ibrahim Musa',
    jobTitle: 'Software Developer',
    basicSalary: 650000,
    housingAllowance: 100000,
    transportAllowance: 50000,
    otherAllowances: 50000,
    totalCompensation: 850000,
    startDate: '2026-02-01',
    status: 'SENT',
    sentAt: '2026-01-06',
    expiresAt: '2026-01-13',
    notes: 'Offer includes signing bonus of ₦500,000',
  },
  {
    id: '2',
    applicantName: 'Blessing Okafor',
    jobTitle: 'Senior Accountant',
    basicSalary: 400000,
    housingAllowance: 60000,
    transportAllowance: 40000,
    otherAllowances: 25000,
    totalCompensation: 525000,
    startDate: '2026-01-15',
    status: 'ACCEPTED',
    sentAt: '2025-12-30',
    expiresAt: '2026-01-06',
    notes: null,
  },
  {
    id: '3',
    applicantName: 'Fatima Abdullahi',
    jobTitle: 'Software Developer',
    basicSalary: 700000,
    housingAllowance: 100000,
    transportAllowance: 50000,
    otherAllowances: 75000,
    totalCompensation: 925000,
    startDate: '2026-02-15',
    status: 'DRAFT',
    sentAt: null,
    expiresAt: null,
    notes: 'Pending approval from finance',
  },
  {
    id: '4',
    applicantName: 'Previous Candidate',
    jobTitle: 'Sales Representative',
    basicSalary: 180000,
    housingAllowance: 30000,
    transportAllowance: 25000,
    otherAllowances: 15000,
    totalCompensation: 250000,
    startDate: '2025-12-01',
    status: 'DECLINED',
    sentAt: '2025-11-20',
    expiresAt: '2025-11-27',
    notes: 'Candidate accepted offer from competitor',
  },
];

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>(DEMO_OFFERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateOfferDialog, setShowCreateOfferDialog] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: any }> = {
      DRAFT: { variant: 'secondary', label: 'Draft', icon: Edit },
      PENDING_APPROVAL: { variant: 'outline', label: 'Pending Approval', icon: Clock },
      SENT: { variant: 'default', label: 'Sent', icon: Send },
      VIEWED: { variant: 'outline', label: 'Viewed', icon: Eye },
      ACCEPTED: { variant: 'default', label: 'Accepted', icon: CheckCircle },
      DECLINED: { variant: 'destructive', label: 'Declined', icon: XCircle },
      EXPIRED: { variant: 'outline', label: 'Expired', icon: Clock },
      WITHDRAWN: { variant: 'outline', label: 'Withdrawn', icon: XCircle },
    };
    const config = variants[status] || { variant: 'secondary', label: status, icon: Clock };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = !searchQuery || 
      offer.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="offers-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/recruitment-suite">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-orange-600" />
              Offers
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Create and track job offers
            </p>
          </div>
        </div>
        <Dialog open={showCreateOfferDialog} onOpenChange={setShowCreateOfferDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-offer-btn">
              <Plus className="mr-2 h-4 w-4" />
              Create Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Job Offer</DialogTitle>
              <DialogDescription>
                Create an offer for a successful candidate
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Select Applicant *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an applicant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Ibrahim Musa - Software Developer</SelectItem>
                    <SelectItem value="3">Fatima Abdullahi - Software Developer</SelectItem>
                    <SelectItem value="4">Adaeze Okonkwo - Senior Accountant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Basic Salary (₦/month) *</Label>
                  <Input type="number" placeholder="e.g., 500000" />
                </div>
                <div className="space-y-2">
                  <Label>Housing Allowance (₦)</Label>
                  <Input type="number" placeholder="e.g., 80000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Transport Allowance (₦)</Label>
                  <Input type="number" placeholder="e.g., 40000" />
                </div>
                <div className="space-y-2">
                  <Label>Other Allowances (₦)</Label>
                  <Input type="number" placeholder="e.g., 30000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proposed Start Date *</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Offer Expiry (days)</Label>
                  <Select defaultValue="7">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Additional Benefits & Notes</Label>
                <Textarea rows={3} placeholder="e.g., Signing bonus, HMO coverage, leave days..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateOfferDialog(false)}>
                Cancel
              </Button>
              <Button variant="outline">Save as Draft</Button>
              <Button onClick={() => setShowCreateOfferDialog(false)}>
                Create & Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{offers.filter((o: any) => o.status === 'DRAFT').length}</div>
            <div className="text-sm text-gray-500">Draft</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{offers.filter((o: any) => o.status === 'SENT').length}</div>
            <div className="text-sm text-gray-500">Sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{offers.filter((o: any) => o.status === 'ACCEPTED').length}</div>
            <div className="text-sm text-gray-500">Accepted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{offers.filter((o: any) => o.status === 'DECLINED').length}</div>
            <div className="text-sm text-gray-500">Declined</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{offers.length}</div>
            <div className="text-sm text-gray-500">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or job..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-offers"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="filter-status">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="DECLINED">Declined</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Offers List */}
      <div className="space-y-4">
        {filteredOffers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No offers found matching your criteria
            </CardContent>
          </Card>
        ) : (
          filteredOffers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-md transition-shadow" data-testid={`offer-card-${offer.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{offer.applicantName}</h3>
                      {getStatusBadge(offer.status)}
                    </div>
                    <p className="text-sm text-gray-500">{offer.jobTitle}</p>
                    
                    {/* Compensation Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-500">Basic Salary</div>
                        <div className="font-medium">{formatCurrency(offer.basicSalary)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Housing</div>
                        <div className="font-medium">{formatCurrency(offer.housingAllowance)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Transport</div>
                        <div className="font-medium">{formatCurrency(offer.transportAllowance)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Other</div>
                        <div className="font-medium">{formatCurrency(offer.otherAllowances)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Total Monthly</div>
                        <div className="font-bold text-green-600">{formatCurrency(offer.totalCompensation)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Start: {new Date(offer.startDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {offer.sentAt && (
                        <span className="flex items-center gap-1">
                          <Send className="h-4 w-4" />
                          Sent: {new Date(offer.sentAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {offer.expiresAt && offer.status === 'SENT' && (
                        <span className="flex items-center gap-1 text-orange-600">
                          <Clock className="h-4 w-4" />
                          Expires: {new Date(offer.expiresAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {offer.notes && (
                      <p className="text-sm text-gray-600 italic">&quot;{offer.notes}&quot;</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {offer.status === 'DRAFT' && (
                      <Button variant="outline" size="sm">
                        <Send className="mr-1 h-4 w-4" />
                        Send Offer
                      </Button>
                    )}
                    {offer.status === 'ACCEPTED' && (
                      <Link href="/recruitment-suite/onboarding">
                        <Button variant="outline" size="sm">
                          Start Onboarding
                        </Button>
                      </Link>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {offer.status === 'SENT' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Accepted
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <XCircle className="mr-2 h-4 w-4" />
                              Mark as Declined
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Withdraw
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
