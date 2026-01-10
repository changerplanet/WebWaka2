/**
 * PROJECT MANAGEMENT SUITE — Tasks Page
 * Phase 7C.2, S5 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  CheckSquare, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Play,
  ArrowLeft,
  Calendar,
  User,
  FolderKanban,
  Clock,
  AlertTriangle
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

interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  milestoneName: string | null;
  assigneeName: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedHours: number | null;
  isOverdue: boolean;
}

const DEMO_TASKS: Task[] = [
  {
    id: '1',
    title: 'Submit architectural drawings for approval',
    description: 'Finalize and submit floor plans to regulatory authority',
    projectId: '1',
    projectName: 'Victoria Island Office Renovation',
    projectCode: 'PRJ-2026-0001',
    milestoneName: 'Design Phase',
    assigneeName: 'Chidi Okonkwo',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: '2026-01-08',
    estimatedHours: 8,
    isOverdue: false,
  },
  {
    id: '2',
    title: 'Review vendor quotations for furniture',
    description: 'Compare quotes from 5 vendors and prepare recommendation',
    projectId: '1',
    projectName: 'Victoria Island Office Renovation',
    projectCode: 'PRJ-2026-0001',
    milestoneName: 'Procurement',
    assigneeName: 'Ngozi Amadi',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '2026-01-10',
    estimatedHours: 4,
    isOverdue: false,
  },
  {
    id: '3',
    title: 'Donor quarterly report submission',
    description: 'Compile and submit Q4 2025 progress report to Ford Foundation',
    projectId: '2',
    projectName: 'Youth Empowerment Program',
    projectCode: 'PRJ-2026-0002',
    milestoneName: 'Reporting',
    assigneeName: 'Amaka Eze',
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
    dueDate: '2026-01-08',
    estimatedHours: 12,
    isOverdue: false,
  },
  {
    id: '4',
    title: 'Recruit training facilitators',
    description: 'Interview and select 10 facilitators for skills training',
    projectId: '2',
    projectName: 'Youth Empowerment Program',
    projectCode: 'PRJ-2026-0002',
    milestoneName: 'Team Setup',
    assigneeName: 'Fatima Abdullahi',
    status: 'TODO',
    priority: 'HIGH',
    dueDate: '2026-01-15',
    estimatedHours: 20,
    isOverdue: false,
  },
  {
    id: '5',
    title: 'Complete payment gateway integration',
    description: 'Integrate Paystack and test all payment flows',
    projectId: '3',
    projectName: 'E-commerce Platform Development',
    projectCode: 'PRJ-2026-0003',
    milestoneName: 'Payment Module',
    assigneeName: 'Tunde Adeyemi',
    status: 'REVIEW',
    priority: 'HIGH',
    dueDate: '2026-01-05',
    estimatedHours: 16,
    isOverdue: true,
  },
  {
    id: '6',
    title: 'User acceptance testing',
    description: 'Coordinate UAT with Dangote Foods team',
    projectId: '3',
    projectName: 'E-commerce Platform Development',
    projectCode: 'PRJ-2026-0003',
    milestoneName: 'Testing',
    assigneeName: null,
    status: 'TODO',
    priority: 'HIGH',
    dueDate: '2026-01-20',
    estimatedHours: 24,
    isOverdue: false,
  },
  {
    id: '7',
    title: 'Prepare training venue',
    description: 'Secure and set up Ikeja training center',
    projectId: '2',
    projectName: 'Youth Empowerment Program',
    projectCode: 'PRJ-2026-0002',
    milestoneName: 'Logistics',
    assigneeName: 'Emeka Nwosu',
    status: 'BLOCKED',
    priority: 'MEDIUM',
    dueDate: '2026-01-12',
    estimatedHours: 6,
    isOverdue: false,
  },
  {
    id: '8',
    title: 'Electrical wiring inspection',
    description: 'Schedule and complete NEPA compliance inspection',
    projectId: '1',
    projectName: 'Victoria Island Office Renovation',
    projectCode: 'PRJ-2026-0001',
    milestoneName: 'Construction',
    assigneeName: 'Ibrahim Musa',
    status: 'DONE',
    priority: 'HIGH',
    dueDate: '2026-01-03',
    estimatedHours: 4,
    isOverdue: false,
  },
];

export default function TasksPage() {
  const [tasks] = useState<Task[]>(DEMO_TASKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      TODO: { color: 'bg-gray-100 text-gray-800', label: 'To Do' },
      IN_PROGRESS: { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
      REVIEW: { color: 'bg-purple-100 text-purple-800', label: 'Review' },
      DONE: { color: 'bg-green-100 text-green-800', label: 'Done' },
      BLOCKED: { color: 'bg-red-100 text-red-800', label: 'Blocked' },
    };
    const style = config[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.color}`}>
        {style.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      LOW: 'secondary',
      MEDIUM: 'outline',
      HIGH: 'default',
      URGENT: 'destructive',
      CRITICAL: 'destructive',
    };
    return <Badge variant={variants[priority] || 'secondary'}>{priority}</Badge>;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assigneeName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Group tasks by status for stats
  const tasksByStatus = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="tasks-page">
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
              <CheckSquare className="h-6 w-6 text-green-600" />
              Tasks
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage tasks across all projects
            </p>
          </div>
        </div>
        <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-task-btn">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to a project
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
                <Label htmlFor="title">Task Title *</Label>
                <Input id="title" placeholder="e.g., Review vendor quotations" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select defaultValue="MEDIUM">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="date" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chidi">Chidi Okonkwo</SelectItem>
                      <SelectItem value="amaka">Amaka Eze</SelectItem>
                      <SelectItem value="tunde">Tunde Adeyemi</SelectItem>
                      <SelectItem value="ngozi">Ngozi Amadi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Estimated Hours</Label>
                  <Input id="hours" type="number" placeholder="e.g., 8" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={3} placeholder="Task details..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTaskDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowNewTaskDialog(false)}>
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{tasksByStatus['TODO'] || 0}</div>
            <div className="text-sm text-gray-500">To Do</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{tasksByStatus['IN_PROGRESS'] || 0}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{tasksByStatus['REVIEW'] || 0}</div>
            <div className="text-sm text-gray-500">Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{tasksByStatus['DONE'] || 0}</div>
            <div className="text-sm text-gray-500">Done</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{tasksByStatus['BLOCKED'] || 0}</div>
            <div className="text-sm text-gray-500">Blocked</div>
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
                placeholder="Search tasks, projects, or assignees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-tasks"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="REVIEW">Review</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="filter-priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No tasks found matching your criteria
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card 
              key={task.id} 
              className={`hover:shadow-md transition-shadow ${task.isOverdue ? 'border-red-300' : ''}`}
              data-testid={`task-card-${task.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-medium ${task.status === 'DONE' ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </h3>
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                      {task.isOverdue && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FolderKanban className="h-3.5 w-3.5" />
                        {task.projectName}
                      </span>
                      {task.milestoneName && (
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {task.milestoneName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {task.assigneeName ? (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {task.assigneeName}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-orange-500">
                          <User className="h-3.5 w-3.5" />
                          Unassigned
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 ${task.isOverdue ? 'text-red-500' : ''}`}>
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(task.dueDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {task.estimatedHours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {task.estimatedHours}h
                        </span>
                      )}
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
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {task.status === 'TODO' && (
                        <DropdownMenuItem>
                          <Play className="mr-2 h-4 w-4" />
                          Start
                        </DropdownMenuItem>
                      )}
                      {task.status !== 'DONE' && (
                        <DropdownMenuItem>
                          <CheckSquare className="mr-2 h-4 w-4" />
                          Mark Complete
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
            <span>Showing {filteredTasks.length} of {tasks.length} tasks</span>
            <div className="flex gap-4">
              <span>{tasks.filter((t: any) => t.isOverdue).length} Overdue</span>
              <span>{tasks.filter((t: any) => !t.assigneeName).length} Unassigned</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
