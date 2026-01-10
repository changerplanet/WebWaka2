/**
 * LEGAL PRACTICE SUITE — Filings Page
 * Phase 7B.1, S5 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Gavel, 
  Plus, 
  Search, 
  CheckCircle,
  Clock,
  MoreVertical,
  Eye,
  Send
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

// Demo filings
const DEMO_FILINGS = [
  { id: '1', title: 'Motion for Adjournment', filingType: 'MOTION', court: 'Federal High Court, Lagos', filedDate: '2026-01-05', matterNumber: 'MAT-2026-0012', filingNumber: 'FHC/MOT/2026/012', filingFee: 5000, feePaid: true, served: false },
  { id: '2', title: 'Originating Summons', filingType: 'ORIGINATING_PROCESS', court: 'Federal High Court, Lagos', filedDate: '2026-01-02', matterNumber: 'MAT-2026-0012', filingNumber: 'FHC/OS/2026/003', filingFee: 15000, feePaid: true, served: true, servedOn: 'ABC Construction Ltd' },
  { id: '3', title: 'Bail Application', filingType: 'MOTION', court: 'Lagos State High Court, Ikeja', filedDate: '2025-11-20', matterNumber: 'MAT-2026-0008', filingNumber: 'LD/MOT/2025/189', filingFee: 3000, feePaid: true, served: true, servedOn: 'DPP Lagos State' },
  { id: '4', title: 'Notice of Appeal', filingType: 'NOTICE', court: 'Court of Appeal, Lagos', filedDate: '2025-09-25', matterNumber: 'MAT-2026-0015', filingNumber: 'CA/L/NOA/2025/078', filingFee: 25000, feePaid: true, served: true, servedOn: 'Pinnacle Enterprises Ltd' },
  { id: '5', title: "Appellant's Brief of Argument", filingType: 'BRIEF', court: 'Court of Appeal, Lagos', filedDate: '2025-12-15', matterNumber: 'MAT-2026-0015', filingNumber: 'CA/L/BRF/2025/112', filingFee: 10000, feePaid: true, served: false },
];

const FILING_TYPE_LABELS: Record<string, string> = {
  ORIGINATING_PROCESS: 'Originating Process',
  MOTION: 'Motion',
  BRIEF: 'Brief',
  AFFIDAVIT: 'Affidavit',
  NOTICE: 'Notice',
  JUDGMENT: 'Judgment',
  ORDER: 'Order',
};

export default function FilingsPage() {
  const [filings] = useState(DEMO_FILINGS);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredFilings = filings.filter((f) => {
    const matchesSearch = 
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.matterNumber.toLowerCase().includes(search.toLowerCase()) ||
      f.court.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || f.filingType === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: filings.length,
    served: filings.filter((f: any) => f.served).length,
    pending: filings.filter((f: any) => !f.served).length,
    totalFees: filings.reduce((sum: any, f: any) => sum + f.filingFee, 0),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/legal-practice-suite" className="hover:text-foreground transition-colors">
          Legal Practice
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Filings</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gavel className="h-6 w-6" />
            Court Filings
          </h1>
          <p className="text-muted-foreground">Track court filings and service</p>
        </div>
        <Button data-testid="add-filing-btn">
          <Plus className="mr-2 h-4 w-4" />
          Record Filing
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Filings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.served}</div>
            <p className="text-xs text-muted-foreground">Served</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending Service</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{formatCurrency(stats.totalFees)}</div>
            <p className="text-xs text-muted-foreground">Filing Fees</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search filings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="filing-search"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ORIGINATING_PROCESS">Originating Process</SelectItem>
                <SelectItem value="MOTION">Motion</SelectItem>
                <SelectItem value="BRIEF">Brief</SelectItem>
                <SelectItem value="NOTICE">Notice</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Filings List */}
      <div className="grid gap-4">
        {filteredFilings.map((filing) => (
          <Card key={filing.id} className="hover:shadow-md transition-shadow" data-testid={`filing-card-${filing.id}`}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Gavel className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{FILING_TYPE_LABELS[filing.filingType]}</Badge>
                      {filing.served ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Served
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending Service
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mt-1">{filing.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {filing.court}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {filing.matterNumber} • <span className="font-mono">{filing.filingNumber}</span>
                    </p>
                    {filing.served && filing.servedOn && (
                      <p className="text-sm text-green-600 mt-1">
                        Served on: {filing.servedOn}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(filing.filedDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fee: {formatCurrency(filing.filingFee)}
                      {filing.feePaid && <span className="text-green-600 ml-1">✓ Paid</span>}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {!filing.served && (
                        <DropdownMenuItem className="text-green-600">
                          <Send className="mr-2 h-4 w-4" />
                          Mark Served
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredFilings.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gavel className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No filings found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
