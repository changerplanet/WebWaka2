/**
 * REAL ESTATE MANAGEMENT — Maintenance Requests Page
 * Phase 7A, S4 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Wrench, 
  Plus, 
  Search, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  User,
  MoreVertical,
  Eye,
  Play,
  Check,
  X
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Demo data
const DEMO_REQUESTS = [
  {
    id: '1',
    requestNumber: 'MNT-2026-00001',
    title: 'Leaking Pipe in Kitchen',
    category: 'PLUMBING',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    propertyName: 'Harmony Estate Phase 2',
    unitNumber: 'Flat 1A',
    requesterName: 'Mr. Chukwuma Eze',
    requesterPhone: '08012345678',
    assignedName: 'Plumbing Solutions Ltd',
    createdAt: '2026-01-05T10:30:00',
  },
  {
    id: '2',
    requestNumber: 'MNT-2026-00002',
    title: 'Power Outlet Not Working',
    category: 'ELECTRICAL',
    priority: 'MEDIUM',
    status: 'OPEN',
    propertyName: 'Victoria Plaza',
    unitNumber: 'Shop A1',
    requesterName: 'Elegance Fashion Store',
    requesterPhone: '07011223344',
    assignedName: null,
    createdAt: '2026-01-06T09:15:00',
  },
  {
    id: '3',
    requestNumber: 'MNT-2026-00003',
    title: 'Broken Window Lock',
    category: 'SECURITY',
    priority: 'EMERGENCY',
    status: 'ASSIGNED',
    propertyName: 'Green Gardens Apartments',
    unitNumber: 'Flat 3A',
    requesterName: 'Dr. Amaka Nwachukwu',
    requesterPhone: '08055667788',
    assignedName: 'SecureFix Services',
    createdAt: '2026-01-06T14:45:00',
  },
  {
    id: '4',
    requestNumber: 'MNT-2025-00045',
    title: 'AC Unit Maintenance',
    category: 'HVAC',
    priority: 'LOW',
    status: 'COMPLETED',
    propertyName: 'Victoria Plaza',
    unitNumber: 'Office 201',
    requesterName: 'Building Management',
    requesterPhone: '09012345678',
    assignedName: 'CoolTech HVAC',
    createdAt: '2025-12-20T11:00:00',
  },
];

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  ASSIGNED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  EMERGENCY: 'bg-red-100 text-red-800',
};

const CATEGORY_ICONS: Record<string, string> = {
  PLUMBING: '🔧',
  ELECTRICAL: '⚡',
  STRUCTURAL: '🏗️',
  HVAC: '❄️',
  CLEANING: '🧹',
  SECURITY: '🔐',
  OTHER: '📋',
};

export default function MaintenanceRequestsPage() {
  const [requests] = useState(DEMO_REQUESTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch = 
      r.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.propertyName.toLowerCase().includes(search.toLowerCase()) ||
      r.requesterName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || r.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: requests.length,
    open: requests.filter((r: any) => r.status === 'OPEN').length,
    inProgress: requests.filter((r: any) => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED').length,
    emergency: requests.filter((r: any) => r.priority === 'EMERGENCY' && r.status !== 'COMPLETED').length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/real-estate-suite" className="hover:text-foreground transition-colors">Real Estate</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Maintenance Requests</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Maintenance Requests
          </h1>
          <p className="text-muted-foreground">Track and manage maintenance tickets</p>
        </div>
        <Button data-testid="add-request-btn">
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className={stats.emergency > 0 ? 'border-red-500' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-red-600">{stats.emergency}</div>
              {stats.emergency > 0 && <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />}
            </div>
            <p className="text-xs text-muted-foreground">Emergency</p>
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
                placeholder="Search requests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="request-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="EMERGENCY">Emergency</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="grid gap-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow" data-testid={`request-card-${request.id}`}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl">
                    {CATEGORY_ICONS[request.category]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-muted-foreground">{request.requestNumber}</span>
                      <Badge className={PRIORITY_COLORS[request.priority]}>
                        {request.priority}
                      </Badge>
                      <Badge className={STATUS_COLORS[request.status]}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mt-1">{request.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {request.unitNumber} • {request.propertyName}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {request.requesterName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(request.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {request.assignedName && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Assigned to</p>
                      <p className="text-sm font-medium">{request.assignedName}</p>
                    </div>
                  )}
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
                      {request.status === 'OPEN' && (
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          Assign
                        </DropdownMenuItem>
                      )}
                      {request.status === 'ASSIGNED' && (
                        <DropdownMenuItem className="text-yellow-600">
                          <Play className="mr-2 h-4 w-4" />
                          Start Work
                        </DropdownMenuItem>
                      )}
                      {(request.status === 'IN_PROGRESS' || request.status === 'ASSIGNED') && (
                        <>
                          <DropdownMenuItem className="text-green-600">
                            <Check className="mr-2 h-4 w-4" />
                            Mark Complete
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredRequests.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No maintenance requests found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
