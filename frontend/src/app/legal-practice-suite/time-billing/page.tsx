/**
 * LEGAL PRACTICE SUITE — Time & Billing Page
 * Phase 7B.1, S5 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Clock, 
  Plus, 
  Search, 
  DollarSign,
  CheckCircle,
  MoreVertical,
  Eye,
  Wallet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Demo time entries
const DEMO_TIME_ENTRIES = [
  { id: '1', date: '2026-01-06', hours: 2.5, activityType: 'RESEARCH', description: 'Legal research on precedents for motion', matterNumber: 'MAT-2026-0012', matterTitle: 'Chief Okafor v. ABC Construction', staffName: 'Barr. Adaeze Nwosu', rate: 50000, approved: true, invoiced: false },
  { id: '2', date: '2026-01-06', hours: 1.0, activityType: 'CALL', description: 'Client call to discuss case strategy', matterNumber: 'MAT-2026-0008', matterTitle: 'State v. Mr. Adebayo', staffName: 'Barr. Chidi Okoro', rate: 50000, approved: true, invoiced: false },
  { id: '3', date: '2026-01-05', hours: 4.0, activityType: 'DRAFTING', description: 'Draft motion for adjournment', matterNumber: 'MAT-2026-0012', matterTitle: 'Chief Okafor v. ABC Construction', staffName: 'Barr. Adaeze Nwosu', rate: 50000, approved: false, invoiced: false },
  { id: '4', date: '2026-01-05', hours: 3.0, activityType: 'APPEARANCE', description: 'Court appearance for hearing', matterNumber: 'MAT-2026-0015', matterTitle: 'Zenith Bank v. Pinnacle', staffName: 'Barr. Adaeze Nwosu', rate: 50000, approved: true, invoiced: true },
  { id: '5', date: '2026-01-04', hours: 2.0, activityType: 'MEETING', description: 'Meeting with opposing counsel', matterNumber: 'MAT-2026-0012', matterTitle: 'Chief Okafor v. ABC Construction', staffName: 'Barr. Chidi Okoro', rate: 40000, approved: true, invoiced: false },
];

// Demo retainers
const DEMO_RETAINERS = [
  { id: '1', clientName: 'Chief Emeka Okafor', matterNumber: 'MAT-2026-0012', initialAmount: 2000000, currentBalance: 1250000, status: 'active' },
  { id: '2', clientName: 'Zenith Bank Plc', matterNumber: 'MAT-2026-0015', initialAmount: 5000000, currentBalance: 3200000, status: 'active' },
  { id: '3', clientName: 'Mr. Tunde Adebayo', matterNumber: 'MAT-2026-0008', initialAmount: 1500000, currentBalance: 150000, status: 'low' },
  { id: '4', clientName: 'NaijaTech Solutions Ltd', matterNumber: 'MAT-2025-0089', initialAmount: 500000, currentBalance: 420000, status: 'active' },
];

const ACTIVITY_LABELS: Record<string, string> = {
  RESEARCH: 'Research',
  DRAFTING: 'Drafting',
  REVIEW: 'Review',
  APPEARANCE: 'Appearance',
  CALL: 'Call',
  MEETING: 'Meeting',
  TRAVEL: 'Travel',
  FILING: 'Filing',
};

export default function TimeBillingPage() {
  const [timeEntries] = useState(DEMO_TIME_ENTRIES);
  const [retainers] = useState(DEMO_RETAINERS);
  const [search, setSearch] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalHours = timeEntries.reduce((sum: any, e: any) => sum + e.hours, 0);
  const unbilledHours = timeEntries.filter((e: any) => !e.invoiced).reduce((sum: any, e: any) => sum + e.hours, 0);
  const unbilledAmount = timeEntries.filter((e: any) => !e.invoiced).reduce((sum: any, e: any) => sum + (e.hours * e.rate), 0);
  const totalRetainerBalance = retainers.reduce((sum: any, r: any) => sum + r.currentBalance, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/legal-practice-suite" className="hover:text-foreground transition-colors">
          Legal Practice
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Time & Billing</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Time & Billing
          </h1>
          <p className="text-muted-foreground">Track billable hours and manage retainers</p>
        </div>
        <Button data-testid="log-time-btn">
          <Plus className="mr-2 h-4 w-4" />
          Log Time
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalHours}h</div>
            <p className="text-xs text-muted-foreground">Total Hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{unbilledHours}h</div>
            <p className="text-xs text-muted-foreground">Unbilled Hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(unbilledAmount)}</div>
            <p className="text-xs text-muted-foreground">Unbilled Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalRetainerBalance)}</div>
            <p className="text-xs text-muted-foreground">Retainer Balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="time" className="space-y-4">
        <TabsList>
          <TabsTrigger value="time">Time Entries</TabsTrigger>
          <TabsTrigger value="retainers">Retainers</TabsTrigger>
        </TabsList>

        <TabsContent value="time" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search time entries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Time Entries Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Matter</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-mono text-xs">{entry.matterNumber}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{entry.matterTitle}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ACTIVITY_LABELS[entry.activityType]}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                    <TableCell className="text-sm">{entry.staffName}</TableCell>
                    <TableCell className="font-medium">{entry.hours}h</TableCell>
                    <TableCell className="font-medium text-green-600">{formatCurrency(entry.hours * entry.rate)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {entry.approved ? (
                          <Badge className="bg-green-100 text-green-800">Approved</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                        )}
                        {entry.invoiced && (
                          <Badge className="bg-blue-100 text-blue-800">Invoiced</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          {!entry.approved && (
                            <DropdownMenuItem className="text-green-600">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="retainers" className="space-y-4">
          {/* Retainers Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {retainers.map((retainer) => (
              <Card key={retainer.id} className={retainer.status === 'low' ? 'border-yellow-500' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{retainer.clientName}</CardTitle>
                    {retainer.status === 'low' && (
                      <Badge variant="destructive">Low Balance</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">{retainer.matterNumber}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Initial Deposit</span>
                      <span>{formatCurrency(retainer.initialAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Balance</span>
                      <span className={`font-bold ${retainer.status === 'low' ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(retainer.currentBalance)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full ${retainer.status === 'low' ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${(retainer.currentBalance / retainer.initialAmount) * 100}%` }}
                      ></div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      <Wallet className="mr-2 h-4 w-4" />
                      Top Up Retainer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
