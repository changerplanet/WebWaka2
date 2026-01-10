/**
 * PROJECT MANAGEMENT SUITE — Dashboard Page
 * Phase 7C.2, S5 Admin UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  FolderKanban, 
  Target, 
  CheckSquare,
  Users,
  Wallet,
  Plus,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  Clock,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Demo data
const DEMO_STATS = {
  summary: {
    totalProjects: 5,
    activeProjects: 3,
    completedProjects: 1,
    overdueProjects: 1,
    totalTasks: 28,
    tasksInProgress: 8,
    overdueTasks: 3,
    tasksDueToday: 4,
  },
  projects: {
    byStatus: { DRAFT: 1, ACTIVE: 3, COMPLETED: 1 },
    byPriority: { LOW: 1, MEDIUM: 2, HIGH: 1, CRITICAL: 1 },
    byHealth: { ON_TRACK: 2, AT_RISK: 2, DELAYED: 1 },
  },
};

const DEMO_PROJECTS = [
  {
    id: '1',
    projectCode: 'PRJ-2026-0001',
    name: 'Victoria Island Office Renovation',
    category: 'Construction',
    status: 'ACTIVE',
    priority: 'HIGH',
    health: 'ON_TRACK',
    progressPercent: 45,
    budgetEstimated: 25000000,
    targetEndDate: '2026-03-15',
    ownerName: 'Chidi Okonkwo',
  },
  {
    id: '2',
    projectCode: 'PRJ-2026-0002',
    name: 'Youth Empowerment Program',
    category: 'NGO Program',
    status: 'ACTIVE',
    priority: 'CRITICAL',
    health: 'AT_RISK',
    progressPercent: 30,
    budgetEstimated: 15000000,
    targetEndDate: '2026-06-30',
    ownerName: 'Amaka Eze',
  },
  {
    id: '3',
    projectCode: 'PRJ-2026-0003',
    name: 'E-commerce Platform Development',
    category: 'Client Project',
    status: 'ACTIVE',
    priority: 'HIGH',
    health: 'DELAYED',
    progressPercent: 60,
    budgetEstimated: 8500000,
    targetEndDate: '2026-02-28',
    ownerName: 'Tunde Adeyemi',
  },
];

const DEMO_TASKS_TODAY = [
  { id: '1', title: 'Submit architectural drawings', projectName: 'Victoria Island Office', priority: 'HIGH', dueTime: '10:00 AM' },
  { id: '2', title: 'Review vendor quotations', projectName: 'Victoria Island Office', priority: 'MEDIUM', dueTime: '2:00 PM' },
  { id: '3', title: 'Donor report submission', projectName: 'Youth Empowerment', priority: 'CRITICAL', dueTime: '5:00 PM' },
  { id: '4', title: 'Code review meeting', projectName: 'E-commerce Platform', priority: 'HIGH', dueTime: '4:00 PM' },
];

export default function ProjectManagementDashboard() {
  const [data] = useState(DEMO_STATS);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'ON_TRACK': return 'bg-green-500';
      case 'AT_RISK': return 'bg-yellow-500';
      case 'DELAYED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      LOW: 'secondary',
      MEDIUM: 'outline',
      HIGH: 'default',
      CRITICAL: 'destructive',
    };
    return <Badge variant={variants[priority] || 'secondary'}>{priority}</Badge>;
  };

  const quickLinks = [
    { href: '/project-management-suite/projects', icon: FolderKanban, label: 'Projects', color: 'bg-blue-500' },
    { href: '/project-management-suite/milestones', icon: Target, label: 'Milestones', color: 'bg-indigo-500' },
    { href: '/project-management-suite/tasks', icon: CheckSquare, label: 'Tasks', color: 'bg-green-500' },
    { href: '/project-management-suite/team', icon: Users, label: 'Team', color: 'bg-purple-500' },
    { href: '/project-management-suite/budget', icon: Wallet, label: 'Budget', color: 'bg-orange-500' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="pm-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FolderKanban className="h-8 w-8 text-blue-600" />
            Project Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track projects, milestones, tasks, and budgets
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-600" data-testid="demo-mode-badge">
          Demo Mode
        </Badge>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full" data-testid={`quicklink-${link.label.toLowerCase()}`}>
              <CardContent className="flex flex-col items-center justify-center p-4">
                <div className={`${link.color} rounded-full p-3 mb-2`}>
                  <link.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-center">{link.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="stat-active-projects">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.overdueProjects} overdue
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-tasks-progress">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks In Progress</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.tasksInProgress}</div>
            <p className="text-xs text-muted-foreground">
              of {data.summary.totalTasks} total
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-overdue-tasks">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.summary.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.tasksDueToday} due today
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-completed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.summary.completedProjects}</div>
            <p className="text-xs text-muted-foreground">
              projects this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Projects & Tasks Due Today */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Active Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Active Projects
              </span>
              <Link href="/project-management-suite/projects">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {DEMO_PROJECTS.map((project) => (
              <div key={project.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{project.name}</span>
                      {getPriorityBadge(project.priority)}
                    </div>
                    <p className="text-xs text-gray-500">{project.projectCode} • {project.category}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getHealthColor(project.health)}`} title={project.health} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{project.progressPercent}%</span>
                  </div>
                  <Progress value={project.progressPercent} className="h-2" />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Owner: {project.ownerName}</span>
                  <span>Due: {new Date(project.targetEndDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tasks Due Today */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Due Today
              </span>
              <Badge variant="secondary">{DEMO_TASKS_TODAY.length} tasks</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {DEMO_TASKS_TODAY.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{task.title}</p>
                  <p className="text-xs text-gray-500">{task.projectName}</p>
                </div>
                <div className="text-right">
                  {getPriorityBadge(task.priority)}
                  <p className="text-xs text-gray-500 mt-1">{task.dueTime}</p>
                </div>
              </div>
            ))}
            <Link href="/project-management-suite/tasks">
              <Button variant="link" className="w-full">
                View All Tasks <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Project Health & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Health Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Project Health
            </CardTitle>
            <CardDescription>Status of active projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>On Track</span>
              </div>
              <Badge variant="secondary">{data.projects.byHealth.ON_TRACK || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>At Risk</span>
              </div>
              <Badge variant="secondary">{data.projects.byHealth.AT_RISK || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Delayed</span>
              </div>
              <Badge variant="secondary">{data.projects.byHealth.DELAYED || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common project management tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link href="/project-management-suite/projects?action=new">
              <Button variant="outline" className="w-full justify-start" data-testid="action-new-project">
                <FolderKanban className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
            <Link href="/project-management-suite/tasks?action=new">
              <Button variant="outline" className="w-full justify-start" data-testid="action-new-task">
                <CheckSquare className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </Link>
            <Link href="/project-management-suite/team?action=add">
              <Button variant="outline" className="w-full justify-start" data-testid="action-add-member">
                <Users className="mr-2 h-4 w-4" />
                Add Team Member
              </Button>
            </Link>
            <Link href="/project-management-suite/budget?action=new">
              <Button variant="outline" className="w-full justify-start" data-testid="action-add-budget">
                <Wallet className="mr-2 h-4 w-4" />
                Add Budget Item
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
