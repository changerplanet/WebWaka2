/**
 * CIVIC SUITE: Dues Service
 * 
 * In-memory service for managing dues and levy collection.
 * Wraps Billing concepts for civic organizations.
 */

import {
  DuesRecord,
  DuesType,
  PaymentStatus,
  formatNaira,
} from './config';
import { getDuesStore, getConstituentsStore } from './demo-data';

// ============================================================================
// DUES SERVICE
// ============================================================================

export async function getDuesRecords(tenantId: string, options?: {
  constituentId?: string;
  status?: PaymentStatus;
  duesType?: DuesType;
  period?: string;
  page?: number;
  limit?: number;
}): Promise<{ dues: DuesRecord[]; total: number; stats: DuesStats }> {
  const store = getDuesStore();
  let filtered = store.filter((d: any) => d.tenantId === tenantId || tenantId === 'demo-civic');
  
  if (options?.constituentId) {
    filtered = filtered.filter((d: any) => d.constituentId === options.constituentId);
  }
  
  if (options?.status) {
    filtered = filtered.filter((d: any) => d.status === options.status);
  }
  
  if (options?.duesType) {
    filtered = filtered.filter((d: any) => d.duesType === options.duesType);
  }
  
  if (options?.period) {
    filtered = filtered.filter((d: any) => d.period === options.period);
  }
  
  const total = filtered.length;
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  
  return {
    dues: paginated,
    total,
    stats: calculateDuesStats(store.filter((d: any) => d.tenantId === tenantId || tenantId === 'demo-civic')),
  };
}

export async function getDuesById(tenantId: string, id: string): Promise<DuesRecord | null> {
  const store = getDuesStore();
  return store.find((d: any) => d.id === id && (d.tenantId === tenantId || tenantId === 'demo-civic')) || null;
}

export async function createDuesRecord(tenantId: string, data: Partial<DuesRecord>): Promise<DuesRecord> {
  const store = getDuesStore();
  const constituents = getConstituentsStore();
  const constituent = constituents.find((c: any) => c.id === data.constituentId);
  
  const newDues: DuesRecord = {
    id: `dues_${Date.now()}`,
    tenantId,
    constituentId: data.constituentId || '',
    constituentName: constituent ? `${constituent.firstName} ${constituent.lastName}` : data.constituentName || '',
    duesType: data.duesType || 'MEMBERSHIP_DUES',
    amount: data.amount || 0,
    dueDate: data.dueDate || new Date().toISOString().split('T')[0],
    status: 'PENDING',
    paidAmount: 0,
    period: data.period || getCurrentPeriod(),
    notes: data.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  store.push(newDues);
  return newDues;
}

export async function recordPayment(
  tenantId: string,
  id: string,
  amount: number,
  receiptNumber?: string
): Promise<DuesRecord | null> {
  const store = getDuesStore();
  const index = store.findIndex((d: any) => d.id === id && (d.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  const dues = store[index];
  const newPaidAmount = dues.paidAmount + amount;
  let newStatus: PaymentStatus = 'PARTIAL';
  
  if (newPaidAmount >= dues.amount) {
    newStatus = 'PAID';
  } else if (newPaidAmount > 0) {
    newStatus = 'PARTIAL';
  }
  
  store[index] = {
    ...dues,
    paidAmount: newPaidAmount,
    status: newStatus,
    paidDate: new Date().toISOString().split('T')[0],
    receiptNumber: receiptNumber || generateReceiptNumber(),
    updatedAt: new Date().toISOString(),
  };
  
  // Update constituent's contribution records
  const constituents = getConstituentsStore();
  const constIndex = constituents.findIndex((c: any) => c.id === dues.constituentId);
  if (constIndex !== -1) {
    constituents[constIndex].totalContributions += amount;
    constituents[constIndex].lastContributionDate = new Date().toISOString().split('T')[0];
    if (newStatus === 'PAID') {
      constituents[constIndex].outstandingBalance = Math.max(0, constituents[constIndex].outstandingBalance - dues.amount);
    }
  }
  
  return store[index];
}

export async function waiveDues(tenantId: string, id: string, reason?: string): Promise<DuesRecord | null> {
  const store = getDuesStore();
  const index = store.findIndex((d: any) => d.id === id && (d.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    status: 'WAIVED',
    notes: reason ? `${store[index].notes || ''}\nWaived: ${reason}`.trim() : store[index].notes,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export async function generateMonthlyDues(
  tenantId: string,
  duesType: DuesType,
  amount: number,
  period: string
): Promise<{ created: number; skipped: number }> {
  const constituents = getConstituentsStore();
  const store = getDuesStore();
  
  const activeConstituents = constituents.filter((c: any) => 
    (c.tenantId === tenantId || tenantId === 'demo-civic') && 
    c.membershipStatus === 'ACTIVE'
  );
  
  let created = 0;
  let skipped = 0;
  
  for (const constituent of activeConstituents) {
    // Check if dues already exist for this period
    const exists = store.some((d: any) => 
      d.constituentId === constituent.id && 
      d.duesType === duesType && 
      d.period === period
    );
    
    if (exists) {
      skipped++;
      continue;
    }
    
    const dueDate = getLastDayOfMonth(period);
    
    store.push({
      id: `dues_${Date.now()}_${created}`,
      tenantId,
      constituentId: constituent.id,
      constituentName: `${constituent.firstName} ${constituent.lastName}`,
      duesType,
      amount,
      dueDate,
      status: 'PENDING',
      paidAmount: 0,
      period,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // Update constituent outstanding balance
    constituent.outstandingBalance += amount;
    
    created++;
  }
  
  return { created, skipped };
}

export async function getOverdueConstituents(tenantId: string): Promise<{
  constituentId: string;
  constituentName: string;
  totalOverdue: number;
  overdueCount: number;
}[]> {
  const store = getDuesStore();
  const overdue = store.filter((d: any) => 
    (d.tenantId === tenantId || tenantId === 'demo-civic') && 
    d.status === 'OVERDUE'
  );
  
  const grouped = overdue.reduce((acc: any, d: any) => {
    if (!acc[d.constituentId]) {
      acc[d.constituentId] = {
        constituentId: d.constituentId,
        constituentName: d.constituentName,
        totalOverdue: 0,
        overdueCount: 0,
      };
    }
    acc[d.constituentId].totalOverdue += (d.amount - d.paidAmount);
    acc[d.constituentId].overdueCount++;
    return acc;
  }, {} as Record<string, { constituentId: string; constituentName: string; totalOverdue: number; overdueCount: number }>);
  
  const result: { constituentId: string; constituentName: string; totalOverdue: number; overdueCount: number }[] = 
    Object.values(grouped).sort((a, b) => b.totalOverdue - a.totalOverdue);
  return result;
}

// ============================================================================
// STATISTICS
// ============================================================================

interface DuesStats {
  totalBilled: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  collectionRate: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

function calculateDuesStats(dues: DuesRecord[]): DuesStats {
  const totalBilled = dues.reduce((sum: any, d: any) => sum + d.amount, 0);
  const totalCollected = dues.reduce((sum: any, d: any) => sum + d.paidAmount, 0);
  const pending = dues.filter((d: any) => d.status === 'PENDING');
  const overdue = dues.filter((d: any) => d.status === 'OVERDUE');
  
  return {
    totalBilled,
    totalCollected,
    totalPending: pending.reduce((sum: any, d: any) => sum + (d.amount - d.paidAmount), 0),
    totalOverdue: overdue.reduce((sum: any, d: any) => sum + (d.amount - d.paidAmount), 0),
    collectionRate: totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0,
    paidCount: dues.filter((d: any) => d.status === 'PAID').length,
    pendingCount: pending.length,
    overdueCount: overdue.length,
  };
}

export async function getDuesStats(tenantId: string): Promise<DuesStats> {
  const store = getDuesStore();
  const filtered = store.filter((d: any) => d.tenantId === tenantId || tenantId === 'demo-civic');
  return calculateDuesStats(filtered);
}

// ============================================================================
// HELPERS
// ============================================================================

function getCurrentPeriod(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getLastDayOfMonth(period: string): string {
  const [month, year] = period.split(' ');
  const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
  const lastDay = new Date(parseInt(year), monthIndex + 1, 0);
  return lastDay.toISOString().split('T')[0];
}

function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RCP-${year}-${random}`;
}
