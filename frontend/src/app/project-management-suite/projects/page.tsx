/**
 * PROJECT MANAGEMENT SUITE — Projects Page
 * Phase 7C.2, S5 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  FolderKanban, 
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
  Calendar,
  Users,
  Target
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

interface Project {
  id: string;
  projectCode: string;
  name: string;
  description: string;
  category: string;
  clientName: string | null;
  ownerName: string;
  status: string;
  priority: string;
  health: string;
  progressPercent: number;
  budgetEstimated: number;
  startDate: string | null;
  targetEndDate: string | null;
  milestoneCount: number;
  taskCount: number;
  teamCount: number;
}

const DEMO_PROJECTS: Project[] = [
  {
    id: '1',
    projectCode: 'PRJ-2026-0001',
    name: 'Victoria Island Office Renovation',
    description: 'Complete renovation of the Lagos head office including new conference rooms and workspace redesign',
    category: 'Construction',
    clientName: null,
    ownerName: 'Chidi Okonkwo',
    status: 'ACTIVE',
    priority: 'HIGH',
    health: 'ON_TRACK',
    progressPercent: 45,
    budgetEstimated: 25000000,
    startDate: '2026-01-02',
    targetEndDate: '2026-03-15',
    milestoneCount: 4,
    taskCount: 12,
    teamCount: 5,
  },
  {
    id: '2',
    projectCode: 'PRJ-2026-0002',
    name: 'Youth Empowerment Program',
    description: 'Skills acquisition and entrepreneurship training for 500 youth in Lagos State',
    category: 'NGO Program',
    clientName: 'Ford Foundation',
    ownerName: 'Amaka Eze',
    status: 'ACTIVE',
    priority: 'CRITICAL',
    health: 'AT_RISK',
    progressPercent: 30,
    budgetEstimated: 15000000,
    startDate: '2026-01-05',
    targetEndDate: '2026-06-30',
    milestoneCount: 6,
    taskCount: 18,
    teamCount: 8,
  },
  {
    id: '3',
    projectCode: 'PRJ-2026-0003',
    name: 'E-commerce Platform Development',
    description: 'Custom e-commerce solution for Dangote Foods retail division',
    category: 'Client Project',
    clientName: 'Dangote Foods Ltd',
    ownerName: 'Tunde Adeyemi',
    status: 'ACTIVE',
    priority: 'HIGH',
    health: 'DELAYED',
    progressPercent: 60,
    budgetEstimated: 8500000,
    startDate: '2025-11-15',
    targetEndDate: '2026-02-28',
    milestoneCount: 5,
    taskCount: 25,
    teamCount: 4,
  },
  {
    id: '4',
    projectCode: 'PRJ-2026-0004',
    name: 'Annual Financial Audit',
    description: 'Internal audit preparation and documentation for FY2025',
    category: 'Internal',
    clientName: null,
    ownerName: 'Ngozi Okafor',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    health: 'ON_TRACK',
    progressPercent: 100,
    budgetEstimated: 2500000,
    startDate: '2025-12-01',
    targetEndDate: '2026-01-05',
    milestoneCount: 3,
    taskCount: 8,
    teamCount: 3,
  },
  {
    id: '5',
    projectCode: 'PRJ-2026-0005',
    name: 'Staff Training Portal',
    description: 'Online learning management system for employee training',
    category: 'Internal',
    clientName: null,
    ownerName: 'Ibrahim Musa',
    status: 'DRAFT',
    priority: 'LOW',
    health: 'ON_TRACK',
    progressPercent: 0,
    budgetEstimated: 3500000,
    startDate: null,
    targetEndDate: '2026-04-30',
    milestoneCount: 0,
    taskCount: 0,
    teamCount: 0,
  },
];

export default function ProjectsPage() {
  const [projects] = useState<Project[]>(DEMO_PROJECTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

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
      ACTIVE: { variant: 'default', label: 'Active' },
      ON_HOLD: { variant: 'outline', label: 'On Hold' },
      COMPLETED: { variant: 'default', label: 'Completed' },
      CANCELLED: { variant: 'destructive', label: 'Cancelled' },
    };
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getHealthIndicator = (health: string) => {
    const colors: Record<string, string> = {
      ON_TRACK: 'bg-green-500',
      AT_RISK: 'bg-yellow-500',
      DELAYED: 'bg-red-500',
    };
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${colors[health] || 'bg-gray-400'}`}></div>
        <span className="text-xs text-gray-500 capitalize">{health.toLowerCase().replace('_', ' ')}</span>
      </div>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      LOW: 'secondary',
      MEDIUM: 'outline',
      HIGH: 'default',
      CRITICAL: 'destructive',
    };
    return <Badge variant={variants[priority] || 'secondary'} className="text-xs">{priority}</Badge>;
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="projects-page">
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
              <FolderKanban className="h-6 w-6 text-blue-600" />
              Projects
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage all your projects
            </p>
          </div>
        </div>
        <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-project-btn">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Set up a new project with basic details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input id="name" placeholder="e.g., Office Renovation" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="ngo">NGO Program</SelectItem>
                      <SelectItem value="client">Client Project</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select defaultValue="MEDIUM">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Target End Date</Label>
                  <Input id="endDate" type="date" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Estimated Budget (₦)</Label>
                  <Input id="budget" type="number" placeholder="e.g., 5000000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client (optional)</Label>
                  <Input id="client" placeholder="e.g., Dangote Foods Ltd" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={3} placeholder="Project description..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowNewProjectDialog(false)}>
                Create Project
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
                placeholder="Search projects by name, code, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-projects"
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
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-gray-500">
              No projects found matching your criteria
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow" data-testid={`project-card-${project.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription>{project.projectCode} • {project.category}</CardDescription>
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
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {project.status === 'DRAFT' && (
                        <DropdownMenuItem>
                          <Play className="mr-2 h-4 w-4" />
                          Start Project
                        </DropdownMenuItem>
                      )}
                      {project.status === 'ACTIVE' && (
                        <>
                          <DropdownMenuItem>
                            <Pause className="mr-2 h-4 w-4" />
                            Put on Hold
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Complete
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
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(project.status)}
                  {getPriorityBadge(project.priority)}
                  {getHealthIndicator(project.health)}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium">{project.progressPercent}%</span>
                  </div>
                  <Progress value={project.progressPercent} className="h-2" />
                </div>

                <div className="flex justify-between text-sm text-gray-500">
                  <span>Budget: {formatCurrency(project.budgetEstimated)}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Target className="h-3.5 w-3.5" />
                      {project.milestoneCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {project.taskCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {project.teamCount}
                    </span>
                  </div>
                  {project.targetEndDate && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(project.targetEndDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  Owner: {project.ownerName}
                  {project.clientName && ` • Client: ${project.clientName}`}
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
            <span>Showing {filteredProjects.length} of {projects.length} projects</span>
            <div className="flex gap-4">
              <span>{projects.filter((p: any) => p.status === 'ACTIVE').length} Active</span>
              <span>{projects.filter((p: any) => p.status === 'DRAFT').length} Draft</span>
              <span>{projects.filter((p: any) => p.status === 'COMPLETED').length} Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
