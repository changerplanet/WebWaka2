/**
 * HOSPITALITY SUITE: Housekeeping Service
 * 
 * In-memory service for managing housekeeping tasks and room status.
 */

import {
  HousekeepingTask,
  HousekeepingTaskType,
  HousekeepingStatus,
  CleaningStatus,
  HOUSEKEEPING_TASK_TYPES,
} from './config';
import { getHousekeepingStore, getRoomsStore } from './demo-data';
import { setRoomCleaningStatus } from './room-service';

// ============================================================================
// HOUSEKEEPING SERVICE
// ============================================================================

export async function getHousekeepingTasks(tenantId: string, options?: {
  status?: HousekeepingStatus;
  taskType?: HousekeepingTaskType;
  roomId?: string;
  assignedTo?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  date?: string;
  page?: number;
  limit?: number;
}): Promise<{ tasks: HousekeepingTask[]; total: number; stats: HousekeepingStats }> {
  const store = getHousekeepingStore();
  let filtered = store.filter((t: any) => t.tenantId === tenantId || tenantId === 'demo-hotel');
  
  if (options?.status) {
    filtered = filtered.filter((t: any) => t.status === options.status);
  }
  
  if (options?.taskType) {
    filtered = filtered.filter((t: any) => t.taskType === options.taskType);
  }
  
  if (options?.roomId) {
    filtered = filtered.filter((t: any) => t.roomId === options.roomId);
  }
  
  if (options?.assignedTo) {
    filtered = filtered.filter((t: any) => t.assignedTo === options.assignedTo);
  }
  
  if (options?.priority) {
    filtered = filtered.filter((t: any) => t.priority === options.priority);
  }
  
  if (options?.date) {
    filtered = filtered.filter((t: any) => t.createdAt.startsWith(options.date!));
  }
  
  // Sort by priority (urgent first) then by scheduled time
  const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  filtered.sort((a: any, b: any) => {
    const priorityDiff = (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
    if (priorityDiff !== 0) return priorityDiff;
    return (a.scheduledTime || '').localeCompare(b.scheduledTime || '');
  });
  
  const total = filtered.length;
  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  
  return {
    tasks: paginated,
    total,
    stats: calculateHousekeepingStats(store.filter((t: any) => t.tenantId === tenantId || tenantId === 'demo-hotel')),
  };
}

export async function getTaskById(tenantId: string, id: string): Promise<HousekeepingTask | null> {
  const store = getHousekeepingStore();
  return store.find((t: any) => t.id === id && (t.tenantId === tenantId || tenantId === 'demo-hotel')) || null;
}

export async function getTasksByRoom(tenantId: string, roomId: string): Promise<HousekeepingTask[]> {
  const store = getHousekeepingStore();
  return store.filter((t: any) => 
    t.roomId === roomId && 
    (t.tenantId === tenantId || tenantId === 'demo-hotel')
  );
}

export async function getPendingTasks(tenantId: string): Promise<HousekeepingTask[]> {
  const store = getHousekeepingStore();
  return store.filter((t: any) => 
    (t.tenantId === tenantId || tenantId === 'demo-hotel') &&
    (t.status === 'PENDING' || t.status === 'ASSIGNED')
  );
}

// ============================================================================
// TASK OPERATIONS
// ============================================================================

export async function createTask(tenantId: string, data: {
  roomId: string;
  roomNumber: string;
  taskType: HousekeepingTaskType;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  scheduledTime?: string;
  assignedTo?: string;
  assignedToName?: string;
  notes?: string;
}): Promise<HousekeepingTask> {
  const store = getHousekeepingStore();
  
  const taskConfig = HOUSEKEEPING_TASK_TYPES[data.taskType];
  const priority = data.priority || (taskConfig.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT');
  
  const newTask: HousekeepingTask = {
    id: `hk_${Date.now()}`,
    tenantId,
    roomId: data.roomId,
    roomNumber: data.roomNumber,
    taskType: data.taskType,
    priority,
    status: data.assignedTo ? 'ASSIGNED' : 'PENDING',
    assignedTo: data.assignedTo,
    assignedToName: data.assignedToName,
    scheduledTime: data.scheduledTime,
    notes: data.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  store.push(newTask);
  
  // Update room cleaning status
  await setRoomCleaningStatus(tenantId, data.roomId, 'DIRTY');
  
  return newTask;
}

export async function assignTask(
  tenantId: string,
  taskId: string,
  assignedTo: string,
  assignedToName: string
): Promise<HousekeepingTask | null> {
  const store = getHousekeepingStore();
  const index = store.findIndex((t: any) => 
    t.id === taskId && 
    (t.tenantId === tenantId || tenantId === 'demo-hotel')
  );
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    assignedTo,
    assignedToName,
    status: 'ASSIGNED',
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function startTask(tenantId: string, taskId: string): Promise<HousekeepingTask | null> {
  const store = getHousekeepingStore();
  const index = store.findIndex((t: any) => 
    t.id === taskId && 
    (t.tenantId === tenantId || tenantId === 'demo-hotel')
  );
  
  if (index === -1) return null;
  
  const task = store[index];
  
  if (task.status === 'COMPLETED' || task.status === 'INSPECTED') {
    throw new Error('Task is already completed');
  }
  
  store[index] = {
    ...task,
    status: 'IN_PROGRESS',
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Update room status
  await setRoomCleaningStatus(tenantId, task.roomId, 'IN_PROGRESS');
  
  return store[index];
}

export async function completeTask(
  tenantId: string,
  taskId: string,
  notes?: string,
  issues?: string
): Promise<HousekeepingTask | null> {
  const store = getHousekeepingStore();
  const index = store.findIndex((t: any) => 
    t.id === taskId && 
    (t.tenantId === tenantId || tenantId === 'demo-hotel')
  );
  
  if (index === -1) return null;
  
  const task = store[index];
  
  store[index] = {
    ...task,
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
    notes: notes || task.notes,
    issues,
    updatedAt: new Date().toISOString(),
  };
  
  // Update room status to clean
  await setRoomCleaningStatus(tenantId, task.roomId, 'CLEAN');
  
  return store[index];
}

export async function inspectTask(
  tenantId: string,
  taskId: string,
  inspectedBy: string,
  passed: boolean,
  notes?: string
): Promise<HousekeepingTask | null> {
  const store = getHousekeepingStore();
  const index = store.findIndex((t: any) => 
    t.id === taskId && 
    (t.tenantId === tenantId || tenantId === 'demo-hotel')
  );
  
  if (index === -1) return null;
  
  const task = store[index];
  
  if (task.status !== 'COMPLETED') {
    throw new Error('Can only inspect completed tasks');
  }
  
  if (passed) {
    store[index] = {
      ...task,
      status: 'INSPECTED',
      inspectedBy,
      inspectedAt: new Date().toISOString(),
      notes: notes || task.notes,
      updatedAt: new Date().toISOString(),
    };
    
    // Update room status to inspected
    await setRoomCleaningStatus(tenantId, task.roomId, 'INSPECTED');
  } else {
    // Failed inspection - create new task
    store[index] = {
      ...task,
      status: 'PENDING',
      inspectedBy,
      inspectedAt: new Date().toISOString(),
      notes: `Inspection failed: ${notes || 'Needs re-cleaning'}`,
      completedAt: undefined,
      startedAt: undefined,
      updatedAt: new Date().toISOString(),
    };
    
    // Update room status back to dirty
    await setRoomCleaningStatus(tenantId, task.roomId, 'DIRTY');
  }
  
  return store[index];
}

export async function cancelTask(tenantId: string, taskId: string): Promise<HousekeepingTask | null> {
  const store = getHousekeepingStore();
  const index = store.findIndex((t: any) => 
    t.id === taskId && 
    (t.tenantId === tenantId || tenantId === 'demo-hotel')
  );
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    status: 'CANCELLED',
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export async function createCheckoutCleanTasks(tenantId: string): Promise<HousekeepingTask[]> {
  const rooms = getRoomsStore();
  const store = getHousekeepingStore();
  const tasks: HousekeepingTask[] = [];
  
  // Find rooms that are due out today
  const dueOutRooms = rooms.filter((r: any) => 
    (r.tenantId === tenantId || tenantId === 'demo-hotel') &&
    r.occupancyStatus === 'DUE_OUT' &&
    r.isActive
  );
  
  for (const room of dueOutRooms) {
    // Check if task already exists for today
    const existingTask = store.find((t: any) => 
      t.roomId === room.id &&
      t.taskType === 'CHECKOUT_CLEAN' &&
      t.createdAt.startsWith(new Date().toISOString().split('T')[0])
    );
    
    if (!existingTask) {
      const task = await createTask(tenantId, {
        roomId: room.id,
        roomNumber: room.roomNumber,
        taskType: 'CHECKOUT_CLEAN',
        priority: 'HIGH',
        notes: `Checkout clean for room ${room.roomNumber}`,
      });
      tasks.push(task);
    }
  }
  
  return tasks;
}

export async function createStayOverTasks(tenantId: string): Promise<HousekeepingTask[]> {
  const rooms = getRoomsStore();
  const store = getHousekeepingStore();
  const tasks: HousekeepingTask[] = [];
  
  // Find occupied rooms that need stay-over service
  const occupiedRooms = rooms.filter((r: any) => 
    (r.tenantId === tenantId || tenantId === 'demo-hotel') &&
    r.occupancyStatus === 'OCCUPIED' &&
    r.isActive
  );
  
  for (const room of occupiedRooms) {
    // Check if task already exists for today
    const existingTask = store.find((t: any) => 
      t.roomId === room.id &&
      (t.taskType === 'STAY_OVER' || t.taskType === 'CHECKOUT_CLEAN') &&
      t.createdAt.startsWith(new Date().toISOString().split('T')[0]) &&
      t.status !== 'CANCELLED'
    );
    
    if (!existingTask) {
      const task = await createTask(tenantId, {
        roomId: room.id,
        roomNumber: room.roomNumber,
        taskType: 'STAY_OVER',
        priority: 'MEDIUM',
        notes: `Stay-over service for room ${room.roomNumber}`,
      });
      tasks.push(task);
    }
  }
  
  return tasks;
}

// ============================================================================
// ROOM STATUS BOARD
// ============================================================================

export interface RoomStatusBoard {
  roomId: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  occupancyStatus: string;
  cleaningStatus: string;
  currentGuest?: string;
  pendingTasks: number;
  inProgressTasks: number;
}

export async function getRoomStatusBoard(tenantId: string): Promise<RoomStatusBoard[]> {
  const rooms = getRoomsStore();
  const tasks = getHousekeepingStore();
  
  const activeRooms = rooms.filter((r: any) => 
    (r.tenantId === tenantId || tenantId === 'demo-hotel') &&
    r.isActive
  );
  
  return activeRooms.map(room => {
    const roomTasks = tasks.filter((t: any) => t.roomId === room.id);
    const pendingTasks = roomTasks.filter((t: any) => 
      t.status === 'PENDING' || t.status === 'ASSIGNED'
    ).length;
    const inProgressTasks = roomTasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
    
    return {
      roomId: room.id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomType: room.roomType,
      occupancyStatus: room.occupancyStatus,
      cleaningStatus: room.cleaningStatus,
      currentGuest: room.currentGuestName,
      pendingTasks,
      inProgressTasks,
    };
  }).sort((a: any, b: any) => a.roomNumber.localeCompare(b.roomNumber));
}

// ============================================================================
// STATISTICS
// ============================================================================

interface HousekeepingStats {
  totalTasks: number;
  pendingTasks: number;
  assignedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  inspectedTasks: number;
  urgentTasks: number;
  highPriorityTasks: number;
  averageCompletionTime: number;
  byTaskType: Record<string, number>;
  byStaff: Record<string, { assigned: number; completed: number }>;
}

function calculateHousekeepingStats(tasks: HousekeepingTask[]): HousekeepingStats {
  const pending = tasks.filter((t: any) => t.status === 'PENDING');
  const assigned = tasks.filter((t: any) => t.status === 'ASSIGNED');
  const inProgress = tasks.filter((t: any) => t.status === 'IN_PROGRESS');
  const completed = tasks.filter((t: any) => t.status === 'COMPLETED');
  const inspected = tasks.filter((t: any) => t.status === 'INSPECTED');
  const urgent = tasks.filter((t: any) => t.priority === 'URGENT' && t.status !== 'COMPLETED' && t.status !== 'INSPECTED');
  const high = tasks.filter((t: any) => t.priority === 'HIGH' && t.status !== 'COMPLETED' && t.status !== 'INSPECTED');
  
  // Calculate average completion time
  const completedWithTimes = [...completed, ...inspected].filter((t: any) => t.startedAt && t.completedAt);
  let avgTime = 0;
  if (completedWithTimes.length > 0) {
    const totalTime = completedWithTimes.reduce((sum: any, t: any) => {
      const start = new Date(t.startedAt!).getTime();
      const end = new Date(t.completedAt!).getTime();
      return sum + (end - start);
    }, 0);
    avgTime = Math.round(totalTime / completedWithTimes.length / 60000); // minutes
  }
  
  // Group by task type
  const byTaskType: Record<string, number> = {};
  tasks.forEach((t: any) => {
    byTaskType[t.taskType] = (byTaskType[t.taskType] || 0) + 1;
  });
  
  // Group by staff
  const byStaff: Record<string, { assigned: number; completed: number }> = {};
  tasks.forEach((t: any) => {
    if (t.assignedTo) {
      const name = t.assignedToName || t.assignedTo;
      if (!byStaff[name]) {
        byStaff[name] = { assigned: 0, completed: 0 };
      }
      byStaff[name].assigned++;
      if (t.status === 'COMPLETED' || t.status === 'INSPECTED') {
        byStaff[name].completed++;
      }
    }
  });
  
  return {
    totalTasks: tasks.length,
    pendingTasks: pending.length,
    assignedTasks: assigned.length,
    inProgressTasks: inProgress.length,
    completedTasks: completed.length,
    inspectedTasks: inspected.length,
    urgentTasks: urgent.length,
    highPriorityTasks: high.length,
    averageCompletionTime: avgTime,
    byTaskType,
    byStaff,
  };
}

export async function getHousekeepingStats(tenantId: string): Promise<HousekeepingStats> {
  const store = getHousekeepingStore();
  const filtered = store.filter((t: any) => t.tenantId === tenantId || tenantId === 'demo-hotel');
  return calculateHousekeepingStats(filtered);
}
