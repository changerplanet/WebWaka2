/**
 * HOSPITALITY SUITE: Housekeeping API Route
 * 
 * GET - List/filter housekeeping tasks
 * POST - Create task or perform operations (assign, start, complete, inspect)
 * PATCH - Update task
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getHousekeepingTasks,
  getTaskById,
  getTasksByRoom,
  getPendingTasks,
  createTask,
  assignTask,
  startTask,
  completeTask,
  inspectTask,
  cancelTask,
  createCheckoutCleanTasks,
  createStayOverTasks,
  getRoomStatusBoard,
  getHousekeepingStats,
} from '@/lib/hospitality/housekeeping-service';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-hotel';
    const { searchParams } = new URL(request.url);
    
    // Check for specific queries
    const id = searchParams.get('id');
    const roomId = searchParams.get('roomId');
    const query = searchParams.get('query');
    
    if (id) {
      const task = await getTaskById(tenantId, id);
      if (!task) {
        return NextResponse.json(
          { success: false, error: 'Task not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, task });
    }
    
    if (roomId) {
      const tasks = await getTasksByRoom(tenantId, roomId);
      return NextResponse.json({
        success: true,
        tasks,
        count: tasks.length,
      });
    }
    
    if (query === 'pending') {
      const tasks = await getPendingTasks(tenantId);
      return NextResponse.json({ success: true, tasks, count: tasks.length });
    }
    
    if (query === 'board') {
      const board = await getRoomStatusBoard(tenantId);
      return NextResponse.json({ success: true, board });
    }
    
    if (query === 'stats') {
      const stats = await getHousekeepingStats(tenantId);
      return NextResponse.json({ success: true, stats });
    }
    
    // Regular listing with filters
    const { tasks, total, stats } = await getHousekeepingTasks(tenantId, {
      status: searchParams.get('status') as any,
      taskType: searchParams.get('taskType') as any,
      assignedTo: searchParams.get('assignedTo') || undefined,
      priority: searchParams.get('priority') as any,
      date: searchParams.get('date') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    });
    
    return NextResponse.json({
      success: true,
      tasks,
      total,
      stats,
    });
  } catch (error) {
    console.error('Housekeeping API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch housekeeping tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-hotel';
    const body = await request.json();
    const { action, taskId, ...data } = body;
    
    // Handle actions on existing tasks
    if (action && taskId) {
      switch (action) {
        case 'assign': {
          if (!data.assignedTo || !data.assignedToName) {
            return NextResponse.json(
              { success: false, error: 'assignedTo and assignedToName are required' },
              { status: 400 }
            );
          }
          const task = await assignTask(tenantId, taskId, data.assignedTo, data.assignedToName);
          if (!task) {
            return NextResponse.json(
              { success: false, error: 'Task not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Task assigned',
            task,
          });
        }
        
        case 'start': {
          const task = await startTask(tenantId, taskId);
          if (!task) {
            return NextResponse.json(
              { success: false, error: 'Task not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Task started',
            task,
          });
        }
        
        case 'complete': {
          const task = await completeTask(tenantId, taskId, data.notes, data.issues);
          if (!task) {
            return NextResponse.json(
              { success: false, error: 'Task not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Task completed',
            task,
          });
        }
        
        case 'inspect': {
          if (data.passed === undefined || !data.inspectedBy) {
            return NextResponse.json(
              { success: false, error: 'passed and inspectedBy are required' },
              { status: 400 }
            );
          }
          const task = await inspectTask(tenantId, taskId, data.inspectedBy, data.passed, data.notes);
          if (!task) {
            return NextResponse.json(
              { success: false, error: 'Task not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            message: data.passed ? 'Task inspection passed' : 'Task inspection failed',
            task,
          });
        }
        
        case 'cancel': {
          const task = await cancelTask(tenantId, taskId);
          if (!task) {
            return NextResponse.json(
              { success: false, error: 'Task not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            message: 'Task cancelled',
            task,
          });
        }
        
        default:
          return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
          );
      }
    }
    
    // Handle bulk operations
    if (action) {
      switch (action) {
        case 'generate-checkout-clean': {
          const tasks = await createCheckoutCleanTasks(tenantId);
          return NextResponse.json({
            success: true,
            message: `Created ${tasks.length} checkout clean tasks`,
            tasks,
          });
        }
        
        case 'generate-stayover': {
          const tasks = await createStayOverTasks(tenantId);
          return NextResponse.json({
            success: true,
            message: `Created ${tasks.length} stay-over tasks`,
            tasks,
          });
        }
      }
    }
    
    // Create new task
    if (!data.roomId || !data.roomNumber || !data.taskType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: roomId, roomNumber, taskType' },
        { status: 400 }
      );
    }
    
    const task = await createTask(tenantId, data);
    
    return NextResponse.json({
      success: true,
      message: 'Task created successfully',
      task,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Housekeeping API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process housekeeping task' },
      { status: 500 }
    );
  }
}
