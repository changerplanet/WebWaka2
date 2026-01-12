'use client';

/**
 * HOSPITALITY SUITE: Housekeeping Management Page
 * 
 * View and manage housekeeping tasks.
 * ⚠️ DEMO ONLY - All data is in-memory.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Filter,
  Play,
  CheckCircle,
  Clock,
  AlertTriangle,
  BedDouble,
} from 'lucide-react';

interface HousekeepingTask {
  id: string;
  roomId: string;
  roomNumber: string;
  taskType: string;
  priority: string;
  status: string;
  assignedTo?: string;
  assignedToName?: string;
  scheduledTime?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

interface HousekeepingStats {
  totalTasks: number;
  pendingTasks: number;
  assignedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  inspectedTasks: number;
  urgentTasks: number;
  highPriorityTasks: number;
}

const TASK_TYPES: Record<string, { name: string }> = {
  CHECKOUT_CLEAN: { name: 'Checkout Clean' },
  STAY_OVER: { name: 'Stay-over' },
  DEEP_CLEAN: { name: 'Deep Clean' },
  TURNDOWN: { name: 'Turndown' },
  INSPECTION: { name: 'Inspection' },
  TOUCH_UP: { name: 'Touch Up' },
};

const TASK_STATUS: Record<string, { name: string; color: string }> = {
  PENDING: { name: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  ASSIGNED: { name: 'Assigned', color: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { name: 'In Progress', color: 'bg-purple-100 text-purple-700' },
  COMPLETED: { name: 'Completed', color: 'bg-green-100 text-green-700' },
  INSPECTED: { name: 'Inspected', color: 'bg-teal-100 text-teal-700' },
  CANCELLED: { name: 'Cancelled', color: 'bg-gray-100 text-gray-700' },
};

const PRIORITY: Record<string, { name: string; color: string }> = {
  LOW: { name: 'Low', color: 'bg-slate-100 text-slate-600' },
  MEDIUM: { name: 'Medium', color: 'bg-blue-100 text-blue-600' },
  HIGH: { name: 'High', color: 'bg-orange-100 text-orange-600' },
  URGENT: { name: 'Urgent', color: 'bg-red-100 text-red-600' },
};

export default function HousekeepingPage() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [stats, setStats] = useState<HousekeepingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [filterStatus, filterPriority]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterPriority !== 'all') {
        params.append('priority', filterPriority);
      }
      const response = await fetch(`/api/hospitality/housekeeping?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.tasks);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load tasks');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      setActionLoading(taskId);
      const response = await fetch('/api/hospitality/housekeeping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          taskId,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchTasks();
      } else {
        alert(data.error || 'Failed to start task');
      }
    } catch (err) {
      alert('Failed to process action');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      setActionLoading(taskId);
      const response = await fetch('/api/hospitality/housekeeping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          taskId,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchTasks();
      } else {
        alert(data.error || 'Failed to complete task');
      }
    } catch (err) {
      alert('Failed to process action');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          <p className="text-slate-600">Loading housekeeping tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
              <Link href="/hospitality/admin">
                <Button variant="ghost" size="sm" data-testid="back-btn">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Housekeeping</h1>
                  <p className="text-xs text-slate-500">{stats?.totalTasks || 0} total tasks</p>
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
              <p className="text-2xl font-bold text-yellow-600">{stats?.pendingTasks || 0}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats?.assignedTasks || 0}</p>
              <p className="text-xs text-slate-500">Assigned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats?.inProgressTasks || 0}</p>
              <p className="text-xs text-slate-500">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats?.completedTasks || 0}</p>
              <p className="text-xs text-slate-500">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats?.urgentTasks || 0}</p>
              <p className="text-xs text-slate-500">Urgent</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48" data-testid="filter-status">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(TASK_STATUS).map(([key, { name }]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40" data-testid="filter-priority">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {Object.entries(PRIORITY).map(([key, { name }]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tasks Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Task Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} data-testid={`task-${task.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{task.roomNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span>{TASK_TYPES[task.taskType]?.name || task.taskType}</span>
                      {task.notes && (
                        <p className="text-xs text-slate-500 truncate max-w-[150px]" title={task.notes}>
                          {task.notes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={PRIORITY[task.priority]?.color || 'bg-slate-100'}>
                        {PRIORITY[task.priority]?.name || task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={TASK_STATUS[task.status]?.color || 'bg-slate-100'}>
                        {TASK_STATUS[task.status]?.name || task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.assignedToName || <span className="text-slate-400">Unassigned</span>}
                    </TableCell>
                    <TableCell>
                      {task.scheduledTime && (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {task.scheduledTime}
                        </div>
                      )}
                      {task.startedAt && !task.completedAt && (
                        <p className="text-xs text-purple-600">Started</p>
                      )}
                      {task.completedAt && (
                        <p className="text-xs text-green-600">Done</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {(task.status === 'PENDING' || task.status === 'ASSIGNED') && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStartTask(task.id)}
                            disabled={actionLoading === task.id}
                            data-testid={`start-${task.id}`}
                          >
                            {actionLoading === task.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-1" /> Start
                              </>
                            )}
                          </Button>
                        )}
                        {task.status === 'IN_PROGRESS' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={actionLoading === task.id}
                            data-testid={`complete-${task.id}`}
                          >
                            {actionLoading === task.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" /> Complete
                              </>
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

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No housekeeping tasks match your filters</p>
          </div>
        )}
      </main>
    </div>
  );
}
