'use client';

/**
 * LOGISTICS SUITE: Jobs Management Page
 * 
 * View and manage delivery jobs.
 * ⚠️ DEMO ONLY - All data is in-memory.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Package,
  ArrowLeft,
  Loader2,
  Filter,
  MapPin,
  User,
  Clock,
  Play,
  CheckCircle,
  Eye,
  Truck,
} from 'lucide-react';

interface Job {
  id: string;
  jobNumber: string;
  jobType: string;
  status: string;
  priority: string;
  driverName?: string;
  vehicleNumber?: string;
  pickupAddress: string;
  deliveryAddress: string;
  customerName?: string;
  itemDescription: string;
  amount: number;
  paymentMethod: string;
  isPaid: boolean;
  scheduledDeliveryTime?: string;
  createdAt: string;
}

interface JobStats {
  totalJobs: number;
  activeJobs: number;
  pendingJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  totalRevenue: number;
  onTimeRate: number;
}

const JOB_STATUS: Record<string, { name: string; color: string }> = {
  CREATED: { name: 'Created', color: 'bg-slate-100 text-slate-700' },
  PENDING: { name: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  ASSIGNED: { name: 'Assigned', color: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { name: 'Accepted', color: 'bg-indigo-100 text-indigo-700' },
  EN_ROUTE_PICKUP: { name: 'En Route', color: 'bg-purple-100 text-purple-700' },
  AT_PICKUP: { name: 'At Pickup', color: 'bg-orange-100 text-orange-700' },
  PICKED_UP: { name: 'Picked Up', color: 'bg-cyan-100 text-cyan-700' },
  IN_TRANSIT: { name: 'In Transit', color: 'bg-blue-100 text-blue-700' },
  AT_DELIVERY: { name: 'At Delivery', color: 'bg-orange-100 text-orange-700' },
  DELIVERED: { name: 'Delivered', color: 'bg-green-100 text-green-700' },
  COMPLETED: { name: 'Completed', color: 'bg-teal-100 text-teal-700' },
  CANCELLED: { name: 'Cancelled', color: 'bg-red-100 text-red-700' },
  FAILED: { name: 'Failed', color: 'bg-red-100 text-red-700' },
};

const JOB_PRIORITY: Record<string, { name: string; color: string }> = {
  LOW: { name: 'Low', color: 'bg-slate-100 text-slate-600' },
  NORMAL: { name: 'Normal', color: 'bg-blue-100 text-blue-600' },
  HIGH: { name: 'High', color: 'bg-orange-100 text-orange-600' },
  URGENT: { name: 'Urgent', color: 'bg-red-100 text-red-600' },
  EXPRESS: { name: 'Express', color: 'bg-purple-500 text-white' },
};

const JOB_TYPES: Record<string, string> = {
  DELIVERY: 'Delivery',
  PICKUP: 'Pickup',
  PICKUP_DELIVERY: 'Pickup & Delivery',
  MULTI_STOP: 'Multi-Stop',
  TRANSPORT: 'Transport',
  FREIGHT: 'Freight',
  TRANSFER: 'Transfer',
};

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Phase 12B: Wrapped in useCallback for hook hygiene
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      
      const response = await fetch(`/api/logistics-suite/jobs?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setJobs(data.jobs);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    try {
      setActionLoading(jobId);
      const response = await fetch('/api/logistics-suite/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-status',
          jobId,
          status: newStatus,
          updatedBy: 'dispatcher',
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchJobs();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      alert('Failed to process action');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-slate-600">Loading jobs...</p>
        </div>
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
              <Link href="/logistics-suite/admin">
                <Button variant="ghost" size="sm" data-testid="back-btn">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Jobs & Dispatch</h1>
                  <p className="text-xs text-slate-500">{stats?.totalJobs || 0} total jobs</p>
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
              <p className="text-2xl font-bold text-blue-600">{stats?.activeJobs || 0}</p>
              <p className="text-xs text-slate-500">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats?.pendingJobs || 0}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats?.completedJobs || 0}</p>
              <p className="text-xs text-slate-500">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-teal-600">{stats?.onTimeRate || 0}%</p>
              <p className="text-xs text-slate-500">On-Time</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-lg font-bold text-slate-900">{formatNaira(stats?.totalRevenue || 0)}</p>
              <p className="text-xs text-slate-500">Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48" data-testid="filter-status">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(JOB_STATUS).map(([key, { name }]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40" data-testid="filter-priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {Object.entries(JOB_PRIORITY).map(([key, { name }]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Jobs Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} data-testid={`job-${job.jobNumber}`}>
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm">{job.jobNumber}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {JOB_TYPES[job.jobType] || job.jobType}
                          </Badge>
                          <Badge className={JOB_PRIORITY[job.priority]?.color || 'bg-slate-100'}>
                            {JOB_PRIORITY[job.priority]?.name || job.priority}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm flex items-center gap-1 text-slate-600">
                          <MapPin className="h-3 w-3 text-green-500" />
                          <span className="truncate">{job.pickupAddress}</span>
                        </p>
                        <p className="text-sm flex items-center gap-1 text-slate-600 mt-1">
                          <MapPin className="h-3 w-3 text-red-500" />
                          <span className="truncate">{job.deliveryAddress}</span>
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.driverName ? (
                        <div>
                          <p className="flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            {job.driverName}
                          </p>
                          {job.vehicleNumber && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <Truck className="h-3 w-3" />
                              {job.vehicleNumber}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{formatNaira(job.amount)}</p>
                      <Badge 
                        variant="outline" 
                        className={job.isPaid ? 'text-green-600 border-green-200' : 'text-amber-600 border-amber-200'}
                      >
                        {job.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={JOB_STATUS[job.status]?.color || 'bg-slate-100'}>
                        {JOB_STATUS[job.status]?.name || job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedJob(job)}
                              data-testid={`view-${job.jobNumber}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Job Details - {job.jobNumber}</DialogTitle>
                              <DialogDescription>
                                {JOB_TYPES[job.jobType]} • {job.customerName || 'Walk-in'}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-slate-500">Status</p>
                                  <Badge className={JOB_STATUS[job.status]?.color}>
                                    {JOB_STATUS[job.status]?.name}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Priority</p>
                                  <Badge className={JOB_PRIORITY[job.priority]?.color}>
                                    {JOB_PRIORITY[job.priority]?.name}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Item</p>
                                <p className="font-medium">{job.itemDescription}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Pickup</p>
                                <p className="text-sm">{job.pickupAddress}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Delivery</p>
                                <p className="text-sm">{job.deliveryAddress}</p>
                              </div>
                              <div className="flex justify-between pt-4 border-t">
                                <div>
                                  <p className="text-xs text-slate-500">Amount</p>
                                  <p className="text-lg font-bold">{formatNaira(job.amount)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Payment</p>
                                  <p className="font-medium">{job.paymentMethod}</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {job.status === 'IN_TRANSIT' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateStatus(job.id, 'DELIVERED')}
                            disabled={actionLoading === job.id}
                            data-testid={`deliver-${job.jobNumber}`}
                          >
                            {actionLoading === job.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {jobs.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No jobs match your filters</p>
          </div>
        )}
      </main>
    </div>
  );
}
