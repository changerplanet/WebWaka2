/**
 * LEGAL PRACTICE SUITE — Deadlines Page
 * Phase 7B.1, S5 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Plus, 
  Search, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  Gavel,
  MoreVertical,
  Eye,
  Check
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

// Demo data
const DEMO_DEADLINES = [
  {
    id: '1',
    title: 'Filing Deadline - Motion for Adjournment',
    deadlineType: 'FILING_DEADLINE',
    status: 'PENDING',
    dueDate: '2026-01-08',
    dueTime: '16:00',
    matterNumber: 'MAT-2026-0012',
    matterTitle: 'Chief Okafor v. ABC Construction Ltd',
    court: 'Federal High Court, Lagos',
    assignedName: 'Barr. Adaeze Nwosu',
    priority: 1,
  },
  {
    id: '2',
    title: 'Court Appearance - Hearing',
    deadlineType: 'COURT_DATE',
    status: 'PENDING',
    dueDate: '2026-01-10',
    dueTime: '09:00',
    matterNumber: 'MAT-2026-0008',
    matterTitle: 'State v. Mr. Adebayo',
    court: 'Lagos State High Court, Ikeja',
    courtroom: 'Court 5',
    assignedName: 'Barr. Chidi Okoro',
    priority: 1,
  },
  {
    id: '3',
    title: 'Brief Submission Deadline',
    deadlineType: 'FILING_DEADLINE',
    status: 'PENDING',
    dueDate: '2026-01-12',
    dueTime: '12:00',
    matterNumber: 'MAT-2026-0015',
    matterTitle: 'Zenith Bank v. Pinnacle Enterprises',
    court: 'Court of Appeal, Lagos Division',
    assignedName: 'Barr. Adaeze Nwosu',
    priority: 2,
  },
  {
    id: '4',
    title: 'Limitation Period - File or Lose',
    deadlineType: 'LIMITATION',
    status: 'PENDING',
    dueDate: '2026-02-15',
    matterNumber: 'MAT-2026-0023',
    matterTitle: 'Potential Breach of Contract Claim',
    assignedName: 'Barr. Funmi Adeola',
    priority: 1,
  },
  {
    id: '5',
    title: 'Response to Interrogatories',
    deadlineType: 'FILING_DEADLINE',
    status: 'COMPLETED',
    dueDate: '2026-01-05',
    matterNumber: 'MAT-2026-0012',
    matterTitle: 'Chief Okafor v. ABC Construction Ltd',
    court: 'Federal High Court, Lagos',
    assignedName: 'Barr. Adaeze Nwosu',
    priority: 2,
  },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  MISSED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  EXTENDED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  COURT_DATE: <Gavel className="h-4 w-4" />,
  FILING_DEADLINE: <Clock className="h-4 w-4" />,
  LIMITATION: <AlertTriangle className="h-4 w-4" />,
  INTERNAL: <Calendar className="h-4 w-4" />,
};

const PRIORITY_COLORS: Record<number, string> = {
  1: 'text-red-600',
  2: 'text-yellow-600',
  3: 'text-gray-600',
};

export default function DeadlinesPage() {
  const [deadlines] = useState(DEMO_DEADLINES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredDeadlines = deadlines.filter((d) => {
    const matchesSearch = 
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.matterNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.matterTitle.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesType = typeFilter === 'all' || d.deadlineType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: deadlines.length,
    pending: deadlines.filter((d: any) => d.status === 'PENDING').length,
    completed: deadlines.filter((d: any) => d.status === 'COMPLETED').length,
    courtDates: deadlines.filter((d: any) => d.deadlineType === 'COURT_DATE' && d.status === 'PENDING').length,
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const isOverdue = (dateStr: string, status: string) => {
    if (status !== 'PENDING') return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/legal-practice-suite" className="hover:text-foreground transition-colors">
          Legal Practice
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Deadlines</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Deadlines & Court Dates
          </h1>
          <p className="text-muted-foreground">Track filing deadlines and court appearances</p>
        </div>
        <Button data-testid="add-deadline-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Deadline
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Deadlines</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.courtDates}</div>
            <p className="text-xs text-muted-foreground">Court Dates</p>
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
                placeholder="Search deadlines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="deadline-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="MISSED">Missed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="COURT_DATE">Court Date</SelectItem>
                <SelectItem value="FILING_DEADLINE">Filing Deadline</SelectItem>
                <SelectItem value="LIMITATION">Limitation</SelectItem>
                <SelectItem value="INTERNAL">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deadlines List */}
      <div className="grid gap-4">
        {filteredDeadlines.map((deadline) => (
          <Card 
            key={deadline.id} 
            className={`hover:shadow-md transition-shadow ${isOverdue(deadline.dueDate, deadline.status) ? 'border-red-500' : ''}`}
            data-testid={`deadline-card-${deadline.id}`}
          >
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${PRIORITY_COLORS[deadline.priority]}`}>
                    {TYPE_ICONS[deadline.deadlineType]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={STATUS_COLORS[deadline.status]}>
                        {deadline.status}
                      </Badge>
                      <Badge variant="outline">
                        {deadline.deadlineType.replace('_', ' ')}
                      </Badge>
                      {isOverdue(deadline.dueDate, deadline.status) && (
                        <Badge variant="destructive">OVERDUE</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mt-1">{deadline.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {deadline.matterNumber} • {deadline.matterTitle}
                    </p>
                    {deadline.court && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {deadline.court} {deadline.courtroom && `• ${deadline.courtroom}`}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Assigned: {deadline.assignedName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-lg font-bold ${isOverdue(deadline.dueDate, deadline.status) ? 'text-red-600' : ''}`}>
                      {formatDate(deadline.dueDate)}
                    </p>
                    {deadline.dueTime && (
                      <p className="text-sm text-muted-foreground">{deadline.dueTime}</p>
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
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {deadline.status === 'PENDING' && (
                        <DropdownMenuItem className="text-green-600">
                          <Check className="mr-2 h-4 w-4" />
                          Mark Complete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDeadlines.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No deadlines found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
