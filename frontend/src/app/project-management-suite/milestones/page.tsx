/**
 * PROJECT MANAGEMENT SUITE — Milestones Page
 * Phase 7C.2, S5 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Target, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Calendar,
  FolderKanban,
  CheckCircle,
  Clock,
  AlertTriangle,
  Flag
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

interface Milestone {
  id: string;
  name: string;
  description: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  orderIndex: number;
  targetDate: string;
  completedDate: string | null;
  isCompleted: boolean;
  taskCount: number;
  tasksCompleted: number;
  progressPercent: number;
  isOverdue: boolean;
}

const DEMO_MILESTONES: Milestone[] = [
  {
    id: '1',
    name: 'Design Phase',
    description: 'Complete all architectural and interior design work',
    projectId: '1',
    projectName: 'Victoria Island Office Renovation',
    projectCode: 'PRJ-2026-0001',
    orderIndex: 1,
    targetDate: '2026-01-15',
    completedDate: null,
    isCompleted: false,
    taskCount: 4,
    tasksCompleted: 2,
    progressPercent: 50,
    isOverdue: false,
  },
  {
    id: '2',
    name: 'Procurement',
    description: 'Source and procure all materials and furniture',
    projectId: '1',
    projectName: 'Victoria Island Office Renovation',
    projectCode: 'PRJ-2026-0001',
    orderIndex: 2,
    targetDate: '2026-01-31',
    completedDate: null,
    isCompleted: false,
    taskCount: 5,
    tasksCompleted: 1,
    progressPercent: 20,
    isOverdue: false,
  },
  {
    id: '3',
    name: 'Construction',
    description: 'Physical renovation and construction work',
    projectId: '1',
    projectName: 'Victoria Island Office Renovation',
    projectCode: 'PRJ-2026-0001',
    orderIndex: 3,
    targetDate: '2026-02-28',
    completedDate: null,
    isCompleted: false,
    taskCount: 6,
    tasksCompleted: 0,
    progressPercent: 0,
    isOverdue: false,
  },
  {
    id: '4',
    name: 'Final Inspection',
    description: 'Quality assurance and regulatory compliance',
    projectId: '1',
    projectName: 'Victoria Island Office Renovation',
    projectCode: 'PRJ-2026-0001',
    orderIndex: 4,
    targetDate: '2026-03-10',
    completedDate: null,
    isCompleted: false,
    taskCount: 3,
    tasksCompleted: 0,
    progressPercent: 0,
    isOverdue: false,
  },
  {
    id: '5',
    name: 'Team Setup',
    description: 'Recruit and onboard program facilitators',
    projectId: '2',
    projectName: 'Youth Empowerment Program',
    projectCode: 'PRJ-2026-0002',
    orderIndex: 1,
    targetDate: '2026-01-20',
    completedDate: null,
    isCompleted: false,
    taskCount: 4,
    tasksCompleted: 1,
    progressPercent: 25,
    isOverdue: false,
  },
  {
    id: '6',
    name: 'Logistics',
    description: 'Secure venues and arrange transportation',
    projectId: '2',
    projectName: 'Youth Empowerment Program',
    projectCode: 'PRJ-2026-0002',
    orderIndex: 2,
    targetDate: '2026-01-25',
    completedDate: null,
    isCompleted: false,
    taskCount: 3,
    tasksCompleted: 0,
    progressPercent: 0,
    isOverdue: false,
  },
  {
    id: '7',
    name: 'Participant Registration',
    description: 'Register and verify 500 youth participants',
    projectId: '2',
    projectName: 'Youth Empowerment Program',
    projectCode: 'PRJ-2026-0002',
    orderIndex: 3,
    targetDate: '2026-02-15',
    completedDate: null,
    isCompleted: false,
    taskCount: 5,
    tasksCompleted: 0,
    progressPercent: 0,
    isOverdue: false,
  },
  {
    id: '8',
    name: 'Payment Module',
    description: 'Integrate Paystack payment gateway',
    projectId: '3',
    projectName: 'E-commerce Platform Development',
    projectCode: 'PRJ-2026-0003',
    orderIndex: 1,
    targetDate: '2026-01-10',
    completedDate: null,
    isCompleted: false,
    taskCount: 4,
    tasksCompleted: 3,
    progressPercent: 75,
    isOverdue: true,
  },
  {
    id: '9',
    name: 'Inventory System',
    description: 'Build product catalog and inventory tracking',
    projectId: '3',
    projectName: 'E-commerce Platform Development',
    projectCode: 'PRJ-2026-0003',
    orderIndex: 2,
    targetDate: '2026-01-20',
    completedDate: '2026-01-05',
    isCompleted: true,
    taskCount: 6,
    tasksCompleted: 6,
    progressPercent: 100,
    isOverdue: false,
  },
  {
    id: '10',
    name: 'Testing',
    description: 'User acceptance testing and bug fixes',
    projectId: '3',
    projectName: 'E-commerce Platform Development',
    projectCode: 'PRJ-2026-0003',
    orderIndex: 3,
    targetDate: '2026-02-10',
    completedDate: null,
    isCompleted: false,
    taskCount: 5,
    tasksCompleted: 0,
    progressPercent: 0,
    isOverdue: false,
  },
];

export default function MilestonesPage() {
  const [milestones] = useState<Milestone[]>(DEMO_MILESTONES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [showNewMilestoneDialog, setShowNewMilestoneDialog] = useState(false);

  const filteredMilestones = milestones.filter(milestone => {
    const matchesSearch = !searchQuery || 
      milestone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      milestone.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'completed' && milestone.isCompleted) ||
      (statusFilter === 'in_progress' && !milestone.isCompleted && milestone.progressPercent > 0) ||
      (statusFilter === 'not_started' && !milestone.isCompleted && milestone.progressPercent === 0) ||
      (statusFilter === 'overdue' && milestone.isOverdue);
    const matchesProject = projectFilter === 'all' || milestone.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  // Group milestones by project for display
  const projects = [...new Set(milestones.map((m: any) => m.projectId))];
  const projectNames = [...new Set(milestones.map((m: any) => ({ id: m.projectId, name: m.projectName })))];

  // Stats
  const totalMilestones = milestones.length;
  const completedCount = milestones.filter((m: any) => m.isCompleted).length;
  const inProgressCount = milestones.filter((m: any) => !m.isCompleted && m.progressPercent > 0).length;
  const overdueCount = milestones.filter((m: any) => m.isOverdue).length;

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="milestones-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/project-management-suite">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="h-6 w-6 text-indigo-600" />
              Milestones
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Track project milestones and deliverables
            </p>
          </div>
        </div>
        <Dialog open={showNewMilestoneDialog} onOpenChange={setShowNewMilestoneDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-milestone-btn">
              <Plus className="mr-2 h-4 w-4" />
              New Milestone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Milestone</DialogTitle>
              <DialogDescription>
                Add a milestone to track project deliverables
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Select Project *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Victoria Island Office Renovation</SelectItem>
                    <SelectItem value="2">Youth Empowerment Program</SelectItem>
                    <SelectItem value="3">E-commerce Platform Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Milestone Name *</Label>
                <Input id="name" placeholder="e.g., Design Phase" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Date *</Label>
                <Input id="targetDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={3} placeholder="Describe the milestone deliverables..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewMilestoneDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowNewMilestoneDialog(false)}>
                Create Milestone
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{totalMilestones}</div>
            <div className="text-sm text-gray-500">Total Milestones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <div className="text-sm text-gray-500">Overdue</div>
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
                placeholder="Search milestones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-milestones"
              />
            </div>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-full md:w-56" data-testid="filter-project">
                <FolderKanban className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="1">Victoria Island Office Renovation</SelectItem>
                <SelectItem value="2">Youth Empowerment Program</SelectItem>
                <SelectItem value="3">E-commerce Platform Development</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="filter-status">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Milestones List */}
      <div className="space-y-4">
        {filteredMilestones.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No milestones found matching your criteria
            </CardContent>
          </Card>
        ) : (
          filteredMilestones.map((milestone) => (
            <Card 
              key={milestone.id} 
              className={`hover:shadow-md transition-shadow ${milestone.isOverdue ? 'border-red-300' : ''}`}
              data-testid={`milestone-card-${milestone.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        milestone.isCompleted ? 'bg-green-100 text-green-700' :
                        milestone.isOverdue ? 'bg-red-100 text-red-700' :
                        'bg-indigo-100 text-indigo-700'
                      }`}>
                        {milestone.orderIndex}
                      </div>
                      <h3 className={`font-medium text-lg ${milestone.isCompleted ? 'line-through text-gray-500' : ''}`}>
                        {milestone.name}
                      </h3>
                      {milestone.isCompleted && (
                        <Badge variant="default" className="bg-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </Badge>
                      )}
                      {milestone.isOverdue && !milestone.isCompleted && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Overdue
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600">{milestone.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FolderKanban className="h-3.5 w-3.5" />
                        {milestone.projectName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {milestone.isCompleted && milestone.completedDate ? (
                          <span className="text-green-600">
                            Completed {new Date(milestone.completedDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                          </span>
                        ) : (
                          <span className={milestone.isOverdue ? 'text-red-600' : ''}>
                            Due {new Date(milestone.targetDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {milestone.tasksCompleted} of {milestone.taskCount} tasks
                        </span>
                        <span className="font-medium">{milestone.progressPercent}%</span>
                      </div>
                      <Progress 
                        value={milestone.progressPercent} 
                        className={`h-2 ${milestone.isCompleted ? 'bg-green-100' : ''}`}
                      />
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
                        View Tasks
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {!milestone.isCompleted && (
                        <DropdownMenuItem>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Complete
                        </DropdownMenuItem>
                      )}
                      {milestone.isCompleted && (
                        <DropdownMenuItem>
                          <Clock className="mr-2 h-4 w-4" />
                          Reopen
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
            <span>Showing {filteredMilestones.length} of {milestones.length} milestones</span>
            <div className="flex gap-4">
              <span>{milestones.filter((m: any) => !m.isCompleted && m.progressPercent === 0).length} Not Started</span>
              <span>{inProgressCount} In Progress</span>
              <span>{completedCount} Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
