/**
 * RECRUITMENT & ONBOARDING SUITE — Onboarding Page
 * Phase 7C.1, S5 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ClipboardCheck, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  FileText,
  Upload,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
import { Checkbox } from '@/components/ui/checkbox';

interface OnboardingTask {
  id: string;
  applicantId: string;
  applicantName: string;
  jobTitle: string;
  taskName: string;
  category: string;
  status: string;
  dueDate: string;
  assignedTo: string | null;
  completedAt: string | null;
  notes: string | null;
  requiresDocument: boolean;
  documentUploaded: boolean;
}

const DEMO_TASKS: OnboardingTask[] = [
  // Blessing Okafor - Senior Accountant (started Jan 15)
  {
    id: '1',
    applicantId: 'app-1',
    applicantName: 'Blessing Okafor',
    jobTitle: 'Senior Accountant',
    taskName: 'Submit National ID / Passport Copy',
    category: 'DOCUMENTATION',
    status: 'COMPLETED',
    dueDate: '2026-01-13',
    assignedTo: 'HR',
    completedAt: '2026-01-10',
    notes: null,
    requiresDocument: true,
    documentUploaded: true,
  },
  {
    id: '2',
    applicantId: 'app-1',
    applicantName: 'Blessing Okafor',
    jobTitle: 'Senior Accountant',
    taskName: 'Submit NYSC Certificate',
    category: 'DOCUMENTATION',
    status: 'COMPLETED',
    dueDate: '2026-01-13',
    assignedTo: 'HR',
    completedAt: '2026-01-11',
    notes: null,
    requiresDocument: true,
    documentUploaded: true,
  },
  {
    id: '3',
    applicantId: 'app-1',
    applicantName: 'Blessing Okafor',
    jobTitle: 'Senior Accountant',
    taskName: 'Submit Bank Account Details',
    category: 'DOCUMENTATION',
    status: 'IN_PROGRESS',
    dueDate: '2026-01-14',
    assignedTo: 'HR',
    completedAt: null,
    notes: 'Awaiting bank letter',
    requiresDocument: true,
    documentUploaded: false,
  },
  {
    id: '4',
    applicantId: 'app-1',
    applicantName: 'Blessing Okafor',
    jobTitle: 'Senior Accountant',
    taskName: 'IT Setup - Email & System Access',
    category: 'IT_SETUP',
    status: 'PENDING',
    dueDate: '2026-01-15',
    assignedTo: 'IT',
    completedAt: null,
    notes: null,
    requiresDocument: false,
    documentUploaded: false,
  },
  {
    id: '5',
    applicantId: 'app-1',
    applicantName: 'Blessing Okafor',
    jobTitle: 'Senior Accountant',
    taskName: 'Orientation Session',
    category: 'ORIENTATION',
    status: 'PENDING',
    dueDate: '2026-01-15',
    assignedTo: 'HR',
    completedAt: null,
    notes: 'Scheduled for first day',
    requiresDocument: false,
    documentUploaded: false,
  },
  {
    id: '6',
    applicantId: 'app-1',
    applicantName: 'Blessing Okafor',
    jobTitle: 'Senior Accountant',
    taskName: 'Submit Guarantor Forms (2)',
    category: 'DOCUMENTATION',
    status: 'OVERDUE',
    dueDate: '2026-01-07',
    assignedTo: 'HR',
    completedAt: null,
    notes: 'Follow up required',
    requiresDocument: true,
    documentUploaded: false,
  },
  // Ibrahim Musa - Software Developer (accepted offer, starting Feb 1)
  {
    id: '7',
    applicantId: 'app-2',
    applicantName: 'Ibrahim Musa',
    jobTitle: 'Software Developer',
    taskName: 'Submit National ID / Passport Copy',
    category: 'DOCUMENTATION',
    status: 'PENDING',
    dueDate: '2026-01-25',
    assignedTo: 'HR',
    completedAt: null,
    notes: null,
    requiresDocument: true,
    documentUploaded: false,
  },
  {
    id: '8',
    applicantId: 'app-2',
    applicantName: 'Ibrahim Musa',
    jobTitle: 'Software Developer',
    taskName: 'Submit Educational Certificates',
    category: 'DOCUMENTATION',
    status: 'PENDING',
    dueDate: '2026-01-25',
    assignedTo: 'HR',
    completedAt: null,
    notes: null,
    requiresDocument: true,
    documentUploaded: false,
  },
];

// Group tasks by applicant
interface ApplicantOnboarding {
  applicantId: string;
  applicantName: string;
  jobTitle: string;
  tasks: OnboardingTask[];
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  progress: number;
}

export default function OnboardingPage() {
  const [tasks, setTasks] = useState<OnboardingTask[]>(DEMO_TASKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'byApplicant' | 'allTasks'>('byApplicant');
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);

  // Group tasks by applicant
  const applicantOnboardings: ApplicantOnboarding[] = [];
  const applicantMap = new Map<string, OnboardingTask[]>();
  
  tasks.forEach(task => {
    if (!applicantMap.has(task.applicantId)) {
      applicantMap.set(task.applicantId, []);
    }
    applicantMap.get(task.applicantId)!.push(task);
  });

  applicantMap.forEach((applicantTasks, applicantId) => {
    const first = applicantTasks[0];
    const completed = applicantTasks.filter((t: any) => t.status === 'COMPLETED').length;
    const overdue = applicantTasks.filter((t: any) => t.status === 'OVERDUE').length;
    applicantOnboardings.push({
      applicantId,
      applicantName: first.applicantName,
      jobTitle: first.jobTitle,
      tasks: applicantTasks,
      totalTasks: applicantTasks.length,
      completedTasks: completed,
      overdueTasks: overdue,
      progress: Math.round((completed / applicantTasks.length) * 100),
    });
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      PENDING: { variant: 'secondary', label: 'Pending' },
      IN_PROGRESS: { variant: 'outline', label: 'In Progress' },
      COMPLETED: { variant: 'default', label: 'Completed' },
      OVERDUE: { variant: 'destructive', label: 'Overdue' },
    };
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DOCUMENTATION': return <FileText className="h-4 w-4" />;
      case 'IT_SETUP': return <User className="h-4 w-4" />;
      case 'ORIENTATION': return <Calendar className="h-4 w-4" />;
      case 'TRAINING': return <ClipboardCheck className="h-4 w-4" />;
      default: return <ClipboardCheck className="h-4 w-4" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.taskName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const overdueTasks = tasks.filter((t: any) => t.status === 'OVERDUE');

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="onboarding-page">
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
              <ClipboardCheck className="h-6 w-6 text-teal-600" />
              Onboarding
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Track new hire onboarding tasks and documents
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'byApplicant' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('byApplicant')}
          >
            By Hire
          </Button>
          <Button
            variant={viewMode === 'allTasks' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('allTasks')}
          >
            All Tasks
          </Button>
          <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-task-btn">
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Onboarding Task</DialogTitle>
                <DialogDescription>
                  Add a task to a new hire&apos;s onboarding checklist
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Select New Hire *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a new hire" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="app-1">Blessing Okafor - Senior Accountant</SelectItem>
                      <SelectItem value="app-2">Ibrahim Musa - Software Developer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Task Name *</Label>
                  <Input placeholder="e.g., Submit Medical Certificate" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select defaultValue="DOCUMENTATION">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                        <SelectItem value="IT_SETUP">IT Setup</SelectItem>
                        <SelectItem value="ORIENTATION">Orientation</SelectItem>
                        <SelectItem value="TRAINING">Training</SelectItem>
                        <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date *</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Manager">Hiring Manager</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="requiresDoc" />
                  <Label htmlFor="requiresDoc">Requires document upload</Label>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea rows={2} placeholder="Any additional instructions..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddTaskDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowAddTaskDialog(false)}>
                  Add Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueTasks.slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center justify-between text-sm">
                  <span>{task.applicantName}: {task.taskName}</span>
                  <span className="text-red-600">Due {new Date(task.dueDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-onboarding"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="filter-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                <SelectItem value="IT_SETUP">IT Setup</SelectItem>
                <SelectItem value="ORIENTATION">Orientation</SelectItem>
                <SelectItem value="TRAINING">Training</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* By Applicant View */}
      {viewMode === 'byApplicant' && (
        <div className="space-y-6">
          {applicantOnboardings.map((applicant) => (
            <Card key={applicant.applicantId} data-testid={`onboarding-${applicant.applicantId}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {applicant.applicantName}
                    </CardTitle>
                    <CardDescription>{applicant.jobTitle}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{applicant.progress}%</div>
                    <div className="text-sm text-gray-500">
                      {applicant.completedTasks} of {applicant.totalTasks} tasks
                    </div>
                  </div>
                </div>
                <Progress value={applicant.progress} className="mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {applicant.tasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        task.status === 'COMPLETED' ? 'bg-green-50 dark:bg-green-900/10 border-green-200' :
                        task.status === 'OVERDUE' ? 'bg-red-50 dark:bg-red-900/10 border-red-200' :
                        'bg-gray-50 dark:bg-gray-800 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${
                          task.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                          task.status === 'OVERDUE' ? 'bg-red-100 text-red-600' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {task.status === 'COMPLETED' ? <CheckCircle className="h-4 w-4" /> : getCategoryIcon(task.category)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${task.status === 'COMPLETED' ? 'line-through text-gray-500' : ''}`}>
                              {task.taskName}
                            </span>
                            {task.requiresDocument && !task.documentUploaded && task.status !== 'COMPLETED' && (
                              <Badge variant="outline" className="text-xs">
                                <Upload className="h-3 w-3 mr-1" />
                                Doc Required
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {task.category.replace('_', ' ')} • {task.assignedTo || 'Unassigned'}
                            {task.completedAt && ` • Completed ${new Date(task.completedAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(task.status)}
                        <span className={`text-sm ${task.status === 'OVERDUE' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          Due {new Date(task.dueDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {task.status !== 'COMPLETED' && (
                              <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Complete
                              </DropdownMenuItem>
                            )}
                            {task.requiresDocument && (
                              <DropdownMenuItem>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Document
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* All Tasks View */}
      {viewMode === 'allTasks' && (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No tasks found matching your criteria
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow" data-testid={`task-card-${task.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${
                        task.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                        task.status === 'OVERDUE' ? 'bg-red-100 text-red-600' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {getCategoryIcon(task.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{task.taskName}</span>
                          {getStatusBadge(task.status)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {task.applicantName} • {task.jobTitle}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        <div className="text-gray-600">{task.assignedTo || 'Unassigned'}</div>
                        <div className={task.status === 'OVERDUE' ? 'text-red-600' : 'text-gray-400'}>
                          Due {new Date(task.dueDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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
            <span>
              {applicantOnboardings.length} new hire{applicantOnboardings.length !== 1 ? 's' : ''} • {tasks.length} total tasks
            </span>
            <div className="flex gap-4">
              <span className="text-green-600">{tasks.filter((t: any) => t.status === 'COMPLETED').length} Completed</span>
              <span>{tasks.filter((t: any) => t.status === 'PENDING').length} Pending</span>
              <span className="text-red-600">{tasks.filter((t: any) => t.status === 'OVERDUE').length} Overdue</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
