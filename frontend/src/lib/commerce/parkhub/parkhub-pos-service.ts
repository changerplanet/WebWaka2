/**
 * PARKHUB POS SERVICE
 * Wave F1: ParkHub Walk-Up POS Interface
 * 
 * Offline-first POS for Nigerian motor parks.
 * Supports ≤3 tap ticket sales, seat selection, and multiple payment methods.
 * NO automation, NO background jobs.
 */

import { prisma } from '@/lib/prisma';
import { ParkHubPosSyncStatus } from '@prisma/client';
import { ParkHubService } from './parkhub-service';

export interface QueueTicketInput {
  parkId: string;
  agentId: string;
  agentName: string;
  clientTicketId: string;
  clientTimestamp: Date;
  routeId: string;
  routeName: string;
  tripId: string;
  tripNumber: string;
  seatNumbers: string[];
  ticketCount: number;
  passengerName?: string;
  passengerPhone?: string;
  unitPrice: number;
  subtotal: number;
  discount?: number;
  roundingAmount?: number;
  roundingMode?: 'N5' | 'N10' | 'N50';
  totalAmount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'POS_CARD' | 'COD';
  paymentNotes?: string;
  bankProofUrl?: string;
}

export interface SyncResult {
  queueId: string;
  success: boolean;
  ticketIds?: string[];
  error?: string;
}

export interface AgentSyncStatus {
  agentId: string;
  queuedCount: number;
  syncingCount: number;
  syncedCount: number;
  errorCount: number;
  lastSyncedAt: Date | null;
  oldestQueuedAt: Date | null;
}

export class ParkHubPosService {
  constructor(private tenantId: string) {}

  async getRoutes(parkId: string) {
    return prisma.park_route.findMany({
      where: {
        tenantId: this.tenantId,
        parkId,
        isActive: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async getTripsForRoute(parkId: string, routeId: string) {
    const trips = await prisma.park_trip.findMany({
      where: {
        tenantId: this.tenantId,
        routeId,
        status: { in: ['SCHEDULED', 'BOARDING'] },
        availableSeats: { gt: 0 },
      },
      orderBy: [
        { scheduledDeparture: 'asc' },
        { createdAt: 'asc' },
      ],
      take: 20,
    });

    return trips.map(trip => ({
      id: trip.id,
      tripNumber: trip.tripNumber,
      departureMode: trip.departureMode,
      scheduledDeparture: trip.scheduledDeparture,
      status: trip.status,
      totalSeats: trip.totalSeats,
      bookedSeats: trip.bookedSeats,
      availableSeats: trip.availableSeats,
      currentPrice: Number(trip.currentPrice),
      departureThreshold: trip.departureThreshold,
    }));
  }

  async getTripSeats(tripId: string) {
    const trip = await prisma.park_trip.findUnique({
      where: { id: tripId },
      include: {
        tickets: {
          where: { status: { in: ['ACTIVE', 'BOARDED'] } },
          select: { seatNumber: true },
        },
      },
    });

    if (!trip) return null;

    const bookedSeatNumbers = trip.tickets
      .map(t => t.seatNumber)
      .filter((s): s is string => s !== null);

    const queuedSeats = await prisma.parkhub_pos_queue.findMany({
      where: {
        tenantId: this.tenantId,
        tripId,
        syncStatus: { in: ['QUEUED', 'SYNCING'] },
      },
      select: { seatNumbers: true },
    });

    const queuedSeatNumbers = queuedSeats.flatMap(q => q.seatNumbers);

    const allSeats: Array<{
      number: string;
      status: 'available' | 'booked' | 'queued';
    }> = [];

    for (let i = 1; i <= trip.totalSeats; i++) {
      const seatNum = i.toString();
      let status: 'available' | 'booked' | 'queued' = 'available';
      
      if (bookedSeatNumbers.includes(seatNum)) {
        status = 'booked';
      } else if (queuedSeatNumbers.includes(seatNum)) {
        status = 'queued';
      }
      
      allSeats.push({ number: seatNum, status });
    }

    return {
      tripId: trip.id,
      tripNumber: trip.tripNumber,
      totalSeats: trip.totalSeats,
      availableSeats: trip.availableSeats,
      currentPrice: Number(trip.currentPrice),
      seats: allSeats,
    };
  }

  async queueTicket(input: QueueTicketInput): Promise<{ queueId: string }> {
    const existing = await prisma.parkhub_pos_queue.findUnique({
      where: {
        tenantId_clientTicketId: {
          tenantId: this.tenantId,
          clientTicketId: input.clientTicketId,
        },
      },
    });

    if (existing) {
      return { queueId: existing.id };
    }

    const queued = await prisma.parkhub_pos_queue.create({
      data: {
        tenantId: this.tenantId,
        parkId: input.parkId,
        agentId: input.agentId,
        agentName: input.agentName,
        clientTicketId: input.clientTicketId,
        clientTimestamp: input.clientTimestamp,
        routeId: input.routeId,
        routeName: input.routeName,
        tripId: input.tripId,
        tripNumber: input.tripNumber,
        seatNumbers: input.seatNumbers,
        ticketCount: input.ticketCount,
        passengerName: input.passengerName,
        passengerPhone: input.passengerPhone,
        unitPrice: input.unitPrice,
        subtotal: input.subtotal,
        discount: input.discount || 0,
        roundingAmount: input.roundingAmount || 0,
        roundingMode: input.roundingMode,
        totalAmount: input.totalAmount,
        paymentMethod: input.paymentMethod,
        paymentNotes: input.paymentNotes,
        bankProofUrl: input.bankProofUrl,
        syncStatus: 'QUEUED',
      },
    });

    return { queueId: queued.id };
  }

  async syncQueuedTickets(agentId: string): Promise<SyncResult[]> {
    const queued = await prisma.parkhub_pos_queue.findMany({
      where: {
        tenantId: this.tenantId,
        agentId,
        syncStatus: 'QUEUED',
      },
      orderBy: { clientTimestamp: 'asc' },
      take: 10,
    });

    const results: SyncResult[] = [];

    for (const item of queued) {
      try {
        await prisma.parkhub_pos_queue.update({
          where: { id: item.id },
          data: {
            syncStatus: 'SYNCING',
            syncAttempts: { increment: 1 },
            lastSyncAttempt: new Date(),
          },
        });

        const ticketIds: string[] = [];

        for (let i = 0; i < item.ticketCount; i++) {
          const seatNumber = item.seatNumbers[i] || null;
          
          const result = await ParkHubService.sellTicket(this.tenantId, {
            tripId: item.tripId,
            passengerName: item.passengerName || 'Walk-up Customer',
            passengerPhone: item.passengerPhone,
            seatNumber: seatNumber,
            paymentMethod: item.paymentMethod as 'CASH' | 'BANK_TRANSFER' | 'POS_CARD',
            soldById: item.agentId,
            soldByName: item.agentName,
            discount: i === 0 ? Number(item.discount) : 0,
            roundingMode: i === 0 ? (item.roundingMode as 'N5' | 'N10' | 'N50' | undefined) : undefined,
            offlineSaleId: `${item.clientTicketId}_${i}`,
          });

          ticketIds.push(result.ticket.id);
        }

        await prisma.parkhub_pos_queue.update({
          where: { id: item.id },
          data: {
            syncStatus: 'SYNCED',
            syncedAt: new Date(),
            syncedTicketIds: ticketIds,
          },
        });

        results.push({
          queueId: item.id,
          success: true,
          ticketIds,
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await prisma.parkhub_pos_queue.update({
          where: { id: item.id },
          data: {
            syncStatus: 'ERROR',
            errorMessage,
          },
        });

        results.push({
          queueId: item.id,
          success: false,
          error: errorMessage,
        });
      }
    }

    return results;
  }

  async getAgentSyncStatus(agentId: string): Promise<AgentSyncStatus> {
    const [queuedCount, syncingCount, syncedCount, errorCount] = await Promise.all([
      prisma.parkhub_pos_queue.count({
        where: { tenantId: this.tenantId, agentId, syncStatus: 'QUEUED' },
      }),
      prisma.parkhub_pos_queue.count({
        where: { tenantId: this.tenantId, agentId, syncStatus: 'SYNCING' },
      }),
      prisma.parkhub_pos_queue.count({
        where: { tenantId: this.tenantId, agentId, syncStatus: 'SYNCED' },
      }),
      prisma.parkhub_pos_queue.count({
        where: { tenantId: this.tenantId, agentId, syncStatus: 'ERROR' },
      }),
    ]);

    const lastSynced = await prisma.parkhub_pos_queue.findFirst({
      where: { tenantId: this.tenantId, agentId, syncStatus: 'SYNCED' },
      orderBy: { syncedAt: 'desc' },
      select: { syncedAt: true },
    });

    const oldestQueued = await prisma.parkhub_pos_queue.findFirst({
      where: { tenantId: this.tenantId, agentId, syncStatus: 'QUEUED' },
      orderBy: { clientTimestamp: 'asc' },
      select: { clientTimestamp: true },
    });

    return {
      agentId,
      queuedCount,
      syncingCount,
      syncedCount,
      errorCount,
      lastSyncedAt: lastSynced?.syncedAt || null,
      oldestQueuedAt: oldestQueued?.clientTimestamp || null,
    };
  }

  async getQueuedItems(agentId: string) {
    return prisma.parkhub_pos_queue.findMany({
      where: {
        tenantId: this.tenantId,
        agentId,
        syncStatus: { in: ['QUEUED', 'ERROR'] },
      },
      orderBy: { clientTimestamp: 'asc' },
    });
  }

  async retryFailedItem(queueId: string): Promise<{ success: boolean }> {
    await prisma.parkhub_pos_queue.update({
      where: { id: queueId },
      data: {
        syncStatus: 'QUEUED',
        errorMessage: null,
      },
    });

    return { success: true };
  }
}

export function createParkHubPosService(tenantId: string): ParkHubPosService {
  return new ParkHubPosService(tenantId);
}
