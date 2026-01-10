/**
 * MODULE 3: CRM & Customer Engagement
 * Offline Service
 * 
 * Defines offline-safe actions and sync behavior.
 * 
 * OFFLINE-SAFE ACTIONS:
 * - Loyalty point earning (queued)
 * - Engagement recording (queued)
 * 
 * READ-ONLY OFFLINE:
 * - Customer data (cached)
 * - Loyalty balance (cached)
 * - Segment membership (cached)
 * 
 * CONSTRAINTS:
 * - No duplicate loyalty awards on sync
 * - Events are idempotent
 * - Campaign execution deferred until online
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { LoyaltyService } from './loyalty-service';

// ============================================================================
// TYPES
// ============================================================================

export interface OfflineLoyaltyEarn {
  clientId: string;
  customerId: string;
  purchaseAmount: number;
  channel: string;
  sourceType: string;
  sourceId: string;
  timestamp: string;
}

export interface OfflineSyncRequest {
  clientId: string;
  lastSyncAt?: string;
  loyaltyEarns: OfflineLoyaltyEarn[];
}

export interface OfflineSyncResult {
  success: boolean;
  syncedAt: string;
  results: Array<{
    clientId: string;
    status: 'processed' | 'duplicate' | 'error';
    pointsAwarded?: number;
    error?: string;
  }>;
}

export interface OfflineDataPackage {
  lastUpdated: string;
  customers: Array<{
    id: string;
    name: string;
    phone: string | null;
    loyaltyPoints: number;
    loyaltyTier: string | null;
  }>;
  loyaltyProgram: {
    name: string;
    pointsName: string;
    pointsPerCurrency: string;
  } | null;
  segments: Array<{
    id: string;
    name: string;
    slug: string;
    memberCount: number;
  }>;
}

// ============================================================================
// CRM OFFLINE SERVICE
// ============================================================================

export class CrmOfflineService {
  /**
   * Get offline data package for caching
   */
  static async getOfflinePackage(tenantId: string): Promise<OfflineDataPackage> {
    const [customers, loyaltyProgram, segments] = await Promise.all([
      prisma.customer.findMany({
        where: { tenantId },
        select: {
          id: true,
          fullName: true,
          phone: true,
          loyaltyPoints: true,
          loyaltyTier: true,
        },
        take: 1000,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.crm_loyalty_programs.findUnique({
        where: { tenantId },
        select: {
          name: true,
          pointsName: true,
          pointsPerCurrency: true,
        },
      }),
      prisma.crm_customer_segments.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          slug: true,
          memberCount: true,
        },
        orderBy: { priority: 'desc' },
      }),
    ]);

    return {
      lastUpdated: new Date().toISOString(),
      customers: customers.map(c => ({
        id: c.id,
        name: c.fullName || 'Unknown',
        phone: c.phone,
        loyaltyPoints: c.loyaltyPoints,
        loyaltyTier: c.loyaltyTier,
      })),
      loyaltyProgram: loyaltyProgram ? {
        name: loyaltyProgram.name,
        pointsName: loyaltyProgram.pointsName,
        pointsPerCurrency: loyaltyProgram.pointsPerCurrency.toString(),
      } : null,
      segments,
    };
  }

  /**
   * Sync offline loyalty earnings
   */
  static async syncLoyaltyEarns(
    tenantId: string,
    request: OfflineSyncRequest,
    userId: string
  ): Promise<OfflineSyncResult> {
    const results: OfflineSyncResult['results'] = [];

    for (const earn of request.loyaltyEarns) {
      try {
        // Check for duplicate by clientId
        const existingTransaction = await prisma.crm_loyalty_transactions.findFirst({
          where: {
            tenantId,
            metadata: {
              path: ['offlineClientId'],
              equals: earn.clientId,
            },
          },
        });

        if (existingTransaction) {
          results.push({
            clientId: earn.clientId,
            status: 'duplicate',
            pointsAwarded: existingTransaction.points,
          });
          continue;
        }

        // Calculate points
        const calculation = await LoyaltyService.calculateEarnPoints(
          tenantId,
          earn.customerId,
          earn.purchaseAmount,
          earn.channel
        );

        if (calculation.points > 0) {
          // Award points with offline metadata
          const program = await prisma.crm_loyalty_programs.findUnique({
            where: { tenantId },
          });

          if (program) {
            const currentBalance = await LoyaltyService.getCustomerBalance(tenantId, earn.customerId);

            await prisma.crm_loyalty_transactions.create({
              data: {
                tenantId,
                programId: program.id,
                customerId: earn.customerId,
                transactionType: 'EARN',
                points: calculation.points,
                balanceAfter: currentBalance + calculation.points,
                sourceType: earn.sourceType,
                sourceId: earn.sourceId,
                ruleId: calculation.ruleId,
                description: `Offline sync: ${calculation.points} points`,
                metadata: {
                  offlineClientId: earn.clientId,
                  offlineTimestamp: earn.timestamp,
                  syncedAt: new Date().toISOString(),
                  syncClientId: request.clientId,
                } as Prisma.InputJsonValue,
                createdBy: userId,
              },
            });

            // Update customer
            await prisma.customer.update({
              where: { id: earn.customerId },
              data: { loyaltyPoints: { increment: calculation.points } },
            });

            results.push({
              clientId: earn.clientId,
              status: 'processed',
              pointsAwarded: calculation.points,
            });
          }
        } else {
          results.push({
            clientId: earn.clientId,
            status: 'processed',
            pointsAwarded: 0,
          });
        }
      } catch (error) {
        results.push({
          clientId: earn.clientId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: true,
      syncedAt: new Date().toISOString(),
      results,
    };
  }

  /**
   * Get changes since last sync
   */
  static async getChangesSince(tenantId: string, lastSyncAt: Date) {
    const [customers, segments, loyaltyTransactions] = await Promise.all([
      prisma.customer.findMany({
        where: { tenantId, updatedAt: { gt: lastSyncAt } },
        select: {
          id: true,
          fullName: true,
          phone: true,
          loyaltyPoints: true,
          loyaltyTier: true,
          updatedAt: true,
        },
      }),
      prisma.crm_customer_segments.findMany({
        where: { tenantId, updatedAt: { gt: lastSyncAt } },
        select: {
          id: true,
          name: true,
          memberCount: true,
          status: true,
          updatedAt: true,
        },
      }),
      prisma.crm_loyalty_transactions.findMany({
        where: { tenantId, createdAt: { gt: lastSyncAt } },
        select: {
          id: true,
          customerId: true,
          transactionType: true,
          points: true,
          balanceAfter: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    return {
      lastSyncAt: lastSyncAt.toISOString(),
      currentTime: new Date().toISOString(),
      changes: {
        customers: customers.map(c => ({
          id: c.id,
          name: c.fullName,
          phone: c.phone,
          loyaltyPoints: c.loyaltyPoints,
          loyaltyTier: c.loyaltyTier,
          updatedAt: c.updatedAt.toISOString(),
        })),
        segments: segments.map(s => ({
          id: s.id,
          name: s.name,
          memberCount: s.memberCount,
          status: s.status,
          updatedAt: s.updatedAt.toISOString(),
        })),
        loyaltyTransactions: loyaltyTransactions.map(t => ({
          id: t.id,
          customerId: t.customerId,
          type: t.transactionType,
          points: t.points,
          balanceAfter: t.balanceAfter,
          createdAt: t.createdAt.toISOString(),
        })),
      },
    };
  }
}
