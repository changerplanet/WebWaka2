/**
 * RECRUITMENT & ONBOARDING SUITE — Jobs Page
 * Phase 7C.1, S5 Admin UI
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  ArrowLeft,
  MapPin,
  Clock,
  Users
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

interface Job {
  id: string;
  jobCode: string;
  title: string;
  department: string;
  location: string;
  workLocation: string;
  employmentType: string;
  salaryMin: number;
  salaryMax: number;
  status: string;
  openings: number;
  applicationsCount: number;
  postedDate: string | null;
  closingDate: string | null;
}

const DEMO_JOBS: Job[] = [
  {
    id: '1',
    jobCode: 'JOB-2026-0001',
    title: 'Sales Representative',
    department: 'Sales',
    location: 'Lagos, Nigeria',
    workLocation: 'On-site',
    employmentType: 'FULL_TIME',
    salaryMin: 150000,
    salaryMax: 250000,
    status: 'OPEN',
    openings: 3,
    applicationsCount: 12,
    postedDate: '2026-01-02',
    closingDate: '2026-02-15',
  },
  {
    id: '2',
    jobCode: 'JOB-2026-0002',
    title: 'Senior Accountant',
    department: 'Finance',
    location: 'Lagos, Nigeria',
    workLocation: 'Hybrid',
    employmentType: 'FULL_TIME',
    salaryMin: 350000,
    salaryMax: 500000,
    status: 'OPEN',
    openings: 1,
    applicationsCount: 8,
    postedDate: '2026-01-03',
    closingDate: '2026-02-20',
  },
  {
    id: '3',
    jobCode: 'JOB-2026-0003',
    title: 'Software Developer',
    department: 'IT',
    location: 'Lagos, Nigeria',
    workLocation: 'Remote',
    employmentType: 'FULL_TIME',
    salaryMin: 500000,
    salaryMax: 900000,
    status: 'OPEN',
    openings: 2,
    applicationsCount: 15,
    postedDate: '2026-01-04',
    closingDate: '2026-03-01',
  },
  {
    id: '4',
    jobCode: 'JOB-2026-0004',
    title: 'Administrative Officer',
    department: 'Admin',
    location: 'Abuja, Nigeria',
    workLocation: 'On-site',
    employmentType: 'FULL_TIME',
    salaryMin: 120000,
    salaryMax: 180000,
    status: 'DRAFT',
    openings: 1,
    applicationsCount: 0,
    postedDate: null,
    closingDate: null,
  },
  {
    id: '5',
    jobCode: 'JOB-2026-0005',
    title: 'Delivery Driver',
    department: 'Operations',
    location: 'Lagos, Nigeria',
    workLocation: 'On-site',
    employmentType: 'CONTRACT',
    salaryMin: 80000,
    salaryMax: 120000,
    status: 'FILLED',
    openings: 5,
    applicationsCount: 20,
    postedDate: '2025-12-15',
    closingDate: '2026-01-05',
  },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(DEMO_JOBS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      DRAFT: { variant: 'secondary', label: 'Draft' },
      OPEN: { variant: 'default', label: 'Open' },
      ON_HOLD: { variant: 'outline', label: 'On Hold' },
      CLOSED: { variant: 'destructive', label: 'Closed' },
      FILLED: { variant: 'default', label: 'Filled' },
      CANCELLED: { variant: 'destructive', label: 'Cancelled' },
    };
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.jobCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="jobs-page">
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
              <Briefcase className="h-6 w-6 text-blue-600" />
              Job Postings
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage job requisitions and postings
            </p>
          </div>
        </div>
        <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-job-btn">
              <Plus className="mr-2 h-4 w-4" />
              Create Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Job Posting</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new job requisition
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input id="title" placeholder="e.g., Sales Representative" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="it">IT</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="e.g., Lagos, Nigeria" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workLocation">Work Location</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on-site">On-site</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salaryMin">Min Salary (₦)</Label>
                  <Input id="salaryMin" type="number" placeholder="150000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryMax">Max Salary (₦)</Label>
                  <Input id="salaryMax" type="number" placeholder="250000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="openings">Openings</Label>
                  <Input id="openings" type="number" defaultValue={1} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea id="description" rows={4} placeholder="Describe the role and responsibilities..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea id="requirements" rows={3} placeholder="List the requirements..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewJobDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowNewJobDialog(false)}>
                Create as Draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search jobs by title, code, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-jobs"
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
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="FILLED">Filled</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No jobs found matching your criteria
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow" data-testid={`job-card-${job.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{job.title}</h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.workLocation}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium text-green-600">
                        {formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}/month
                      </span>
                      <span className="text-gray-500">
                        {job.openings} opening{job.openings > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{job.applicationsCount} applicant{job.applicationsCount !== 1 ? 's' : ''}</span>
                      {job.postedDate && (
                        <>
                          <span>•</span>
                          <span>Posted {new Date(job.postedDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/recruitment-suite/applications?jobId=${job.id}`}>
                      <Button variant="outline" size="sm">
                        <Users className="mr-1 h-4 w-4" />
                        View Applicants
                      </Button>
                    </Link>
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
                        {job.status === 'DRAFT' && (
                          <DropdownMenuItem>
                            <Play className="mr-2 h-4 w-4" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        {job.status === 'OPEN' && (
                          <>
                            <DropdownMenuItem>
                              <Pause className="mr-2 h-4 w-4" />
                              Put on Hold
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Filled
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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

      {/* Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Showing {filteredJobs.length} of {jobs.length} jobs</span>
            <div className="flex gap-4">
              <span>{jobs.filter((j: any) => j.status === 'OPEN').length} Open</span>
              <span>{jobs.filter((j: any) => j.status === 'DRAFT').length} Draft</span>
              <span>{jobs.filter((j: any) => j.status === 'FILLED').length} Filled</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
