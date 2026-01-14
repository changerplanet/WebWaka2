/**
 * RECRUITMENT & ONBOARDING SUITE — Applications Page
 * Phase 7C.1, S5 Admin UI
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  ArrowRight,
  ArrowLeft,
  Star,
  Mail,
  Phone,
  FileText,
  ChevronRight
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

interface Application {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantLocation: string;
  jobId: string;
  jobTitle: string;
  stage: string;
  score: number | null;
  rating: number;
  source: string;
  applicationDate: string;
  expectedSalary: number | null;
}

const STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'ASSESSMENT', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN'];

const DEMO_APPLICATIONS: Application[] = [
  {
    id: '1',
    applicantName: 'Adaeze Okonkwo',
    applicantEmail: 'adaeze.okonkwo@email.com',
    applicantPhone: '+234 803 456 7890',
    applicantLocation: 'Lagos',
    jobId: '2',
    jobTitle: 'Senior Accountant',
    stage: 'INTERVIEW',
    score: 85,
    rating: 4,
    source: 'LinkedIn',
    applicationDate: '2026-01-03',
    expectedSalary: 400000,
  },
  {
    id: '2',
    applicantName: 'Emeka Nwosu',
    applicantEmail: 'emeka.nwosu@email.com',
    applicantPhone: '+234 705 123 4567',
    applicantLocation: 'Lagos',
    jobId: '1',
    jobTitle: 'Sales Representative',
    stage: 'INTERVIEW',
    score: 78,
    rating: 4,
    source: 'Jobberman',
    applicationDate: '2026-01-04',
    expectedSalary: 200000,
  },
  {
    id: '3',
    applicantName: 'Fatima Abdullahi',
    applicantEmail: 'fatima.abdullahi@email.com',
    applicantPhone: '+234 809 876 5432',
    applicantLocation: 'Abuja',
    jobId: '3',
    jobTitle: 'Software Developer',
    stage: 'ASSESSMENT',
    score: 92,
    rating: 5,
    source: 'Referral',
    applicationDate: '2026-01-05',
    expectedSalary: 750000,
  },
  {
    id: '4',
    applicantName: 'Chukwudi Eze',
    applicantEmail: 'chukwudi.eze@email.com',
    applicantPhone: '+234 812 345 6789',
    applicantLocation: 'Port Harcourt',
    jobId: '1',
    jobTitle: 'Sales Representative',
    stage: 'SCREENING',
    score: 65,
    rating: 3,
    source: 'Direct',
    applicationDate: '2026-01-06',
    expectedSalary: 180000,
  },
  {
    id: '5',
    applicantName: 'Ngozi Amadi',
    applicantEmail: 'ngozi.amadi@email.com',
    applicantPhone: '+234 706 234 5678',
    applicantLocation: 'Lagos',
    jobId: '1',
    jobTitle: 'Sales Representative',
    stage: 'APPLIED',
    score: null,
    rating: 0,
    source: 'Direct',
    applicationDate: '2026-01-07',
    expectedSalary: null,
  },
  {
    id: '6',
    applicantName: 'Ibrahim Musa',
    applicantEmail: 'ibrahim.musa@email.com',
    applicantPhone: '+234 803 567 8901',
    applicantLocation: 'Kano',
    jobId: '3',
    jobTitle: 'Software Developer',
    stage: 'OFFER',
    score: 88,
    rating: 5,
    source: 'LinkedIn',
    applicationDate: '2026-01-02',
    expectedSalary: 800000,
  },
  {
    id: '7',
    applicantName: 'Blessing Okafor',
    applicantEmail: 'blessing.okafor@email.com',
    applicantPhone: '+234 813 456 7890',
    applicantLocation: 'Lagos',
    jobId: '2',
    jobTitle: 'Senior Accountant',
    stage: 'HIRED',
    score: 90,
    rating: 5,
    source: 'Jobberman',
    applicationDate: '2025-12-20',
    expectedSalary: 450000,
  },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>(DEMO_APPLICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
  const [showNewApplicationDialog, setShowNewApplicationDialog] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStageBadge = (stage: string) => {
    const colors: Record<string, string> = {
      APPLIED: 'bg-gray-100 text-gray-800',
      SCREENING: 'bg-blue-100 text-blue-800',
      INTERVIEW: 'bg-purple-100 text-purple-800',
      ASSESSMENT: 'bg-indigo-100 text-indigo-800',
      OFFER: 'bg-orange-100 text-orange-800',
      HIRED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      WITHDRAWN: 'bg-gray-100 text-gray-600',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[stage] || 'bg-gray-100 text-gray-800'}`}>
        {stage.toLowerCase().replace('_', ' ')}
      </span>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = !searchQuery || 
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicantEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === 'all' || app.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  // Group by stage for pipeline view
  const pipelineData = STAGES.reduce((acc, stage) => {
    acc[stage] = filteredApplications.filter(app => app.stage === stage);
    return acc;
  }, {} as Record<string, Application[]>);

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="applications-page">
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
              <Users className="h-6 w-6 text-green-600" />
              Applications
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Track and manage job applications
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
          <Button
            variant={viewMode === 'pipeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('pipeline')}
          >
            Pipeline View
          </Button>
          <Dialog open={showNewApplicationDialog} onOpenChange={setShowNewApplicationDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-applicant-btn">
                <Plus className="mr-2 h-4 w-4" />
                Add Applicant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Applicant</DialogTitle>
                <DialogDescription>
                  Manually add an applicant to a job posting
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="job">Select Job *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a job posting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Sales Representative</SelectItem>
                      <SelectItem value="2">Senior Accountant</SelectItem>
                      <SelectItem value="3">Software Developer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" placeholder="e.g., Chinedu Obi" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="+234 913 500 3000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" placeholder="e.g., Lagos" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="How did they apply?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Direct Application</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="jobberman">Jobberman</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="walkin">Walk-in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedSalary">Expected Salary (₦)</Label>
                    <Input id="expectedSalary" type="number" placeholder="e.g., 250000" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" rows={3} placeholder="Any additional notes..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewApplicationDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowNewApplicationDialog(false)}>
                  Add Applicant
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or job..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-applications"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="filter-stage">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {STAGES.map(stage => (
                  <SelectItem key={stage} value={stage}>
                    {stage.toLowerCase().replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline View */}
      {viewMode === 'pipeline' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.slice(0, 6).map(stage => (
              <div key={stage} className="w-72 flex-shrink-0">
                <div className="flex items-center justify-between mb-3 px-2">
                  <h3 className="font-medium text-sm uppercase tracking-wide text-gray-600">
                    {stage.toLowerCase().replace('_', ' ')}
                  </h3>
                  <Badge variant="secondary">{pipelineData[stage]?.length || 0}</Badge>
                </div>
                <div className="space-y-3">
                  {pipelineData[stage]?.map(app => (
                    <Card key={app.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{app.applicantName}</h4>
                          {app.rating > 0 && renderStars(app.rating)}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{app.jobTitle}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">{app.source}</span>
                          {app.score && (
                            <span className="font-medium text-blue-600">{app.score}%</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!pipelineData[stage] || pipelineData[stage].length === 0) && (
                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed rounded-lg">
                      No applicants
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No applications found matching your criteria
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow" data-testid={`application-card-${app.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {app.applicantName.split(' ').map((n: any) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{app.applicantName}</h3>
                          {getStageBadge(app.stage)}
                          {app.rating > 0 && <div className="ml-2">{renderStars(app.rating)}</div>}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {app.jobTitle}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {app.applicantEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {app.applicantPhone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {app.score && (
                          <div className="text-sm font-medium text-blue-600">Score: {app.score}%</div>
                        )}
                        <div className="text-xs text-gray-400">
                          Applied {new Date(app.applicationDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Move to Next Stage
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Schedule Interview</DropdownMenuItem>
                          <DropdownMenuItem>Create Offer</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Reject</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Showing {filteredApplications.length} of {applications.length} applications</span>
            <div className="flex gap-4">
              {STAGES.slice(0, 5).map(stage => (
                <span key={stage}>
                  {pipelineData[stage]?.length || 0} {stage.toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
