/**
 * ParkHub Manifest Service
 * Wave F8: Manifest Generation
 * 
 * Generates and manages passenger manifests for ParkHub trips.
 * Nigeria-first, paper-first, offline-capable design.
 * 
 * NO automation, NO background jobs, user-triggered only.
 */

import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';
import {
  ManifestData,
  ManifestPassenger,
  GenerateManifestRequest,
  GenerateManifestResult,
  PrintManifestResult,
  VerifyManifestResult,
  ManifestListItem,
  ManifestRevision,
  ManifestStatus,
  ManifestSyncStatus,
} from './types';

type PrismaManifest = {
  id: string;
  tenantId: string;
  tripId: string;
  parkId: string;
  manifestNumber: string;
  serialNumber: string;
  routeName: string;
  origin: string;
  destination: string;
  departureMode: string;
  scheduledDeparture: Date | null;
  vehiclePlateNumber: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  driverName: string | null;
  driverPhone: string | null;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  passengerList: unknown;
  totalRevenue: { toNumber(): number } | number;
  cashAmount: { toNumber(): number } | number;
  cardAmount: { toNumber(): number } | number;
  transferAmount: { toNumber(): number } | number;
  status: string;
  syncStatus: string;
  verificationHash: string | null;
  qrCodeData: string | null;
  isDemo: boolean;
  generatedById: string | null;
  generatedByName: string | null;
  generatedAt: Date | null;
  printCount: number;
  lastPrintedAt: Date | null;
  lastPrintedById: string | null;
  lastPrintedByName: string | null;
  parkName: string | null;
  parkLocation: string | null;
  parkPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class ManifestService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  async generateManifest(request: GenerateManifestRequest): Promise<GenerateManifestResult> {
    try {
      const existingManifest = await prisma.park_manifest.findUnique({
        where: { tripId: request.tripId },
      });

      if (existingManifest) {
        if (existingManifest.tenantId !== this.tenantId) {
          return { success: false, error: 'Access denied' };
        }
        return {
          success: true,
          manifest: this.mapToManifestData(existingManifest as PrismaManifest),
        };
      }

      const trip = await prisma.park_trip.findFirst({
        where: {
          id: request.tripId,
          tenantId: this.tenantId,
        },
        include: {
          tickets: {
            where: {
              status: { in: ['VALID', 'BOARDED'] },
            },
            orderBy: { seatNumber: 'asc' },
          },
          driver: true,
          vehicle: true,
        },
      });

      if (!trip) {
        return { success: false, error: 'Trip not found or access denied' };
      }

      const route = await prisma.park_route.findFirst({
        where: {
          id: trip.routeId,
          tenantId: this.tenantId,
        },
      });

      if (!route) {
        return { success: false, error: 'Route not found' };
      }

      const passengerList: ManifestPassenger[] = trip.tickets.map((ticket: { id: string; seatNumber: string | null; passengerName: string; passengerPhone: string | null; ticketNumber: string; paymentMethod: string; totalPaid: unknown }) => ({
        seatNumber: ticket.seatNumber || 'N/A',
        passengerName: ticket.passengerName,
        passengerPhone: ticket.passengerPhone,
        ticketNumber: ticket.ticketNumber,
        ticketId: ticket.id,
        paymentMethod: ticket.paymentMethod,
        amount: Number(ticket.totalPaid),
      }));

      const totalRevenue = passengerList.reduce((sum, p) => sum + p.amount, 0);
      const cashAmount = passengerList
        .filter((p) => p.paymentMethod === 'CASH')
        .reduce((sum, p) => sum + p.amount, 0);
      const cardAmount = passengerList
        .filter((p) => p.paymentMethod === 'POS_CARD' || p.paymentMethod === 'CARD')
        .reduce((sum, p) => sum + p.amount, 0);
      const transferAmount = passengerList
        .filter((p) => p.paymentMethod === 'BANK_TRANSFER')
        .reduce((sum, p) => sum + p.amount, 0);

      const isOfflineSync = !!(request.offlineManifestNumber && request.offlineVerificationHash);
      
      let manifestNumber: string;
      let verificationHash: string;
      let qrCodeData: string;
      
      if (isOfflineSync) {
        manifestNumber = request.offlineManifestNumber!;
        verificationHash = request.offlineVerificationHash!;
        qrCodeData = request.offlineQrCodeData || JSON.stringify({
          type: 'PARK_MANIFEST',
          id: manifestNumber,
          t: this.tenantId,
          v: verificationHash.substring(0, 12),
          demo: request.isDemo ?? false,
        });
      } else {
        manifestNumber = await this.generateManifestNumber();
        verificationHash = this.generateVerificationHash({
          manifestNumber,
          tripId: request.tripId,
          tenantId: this.tenantId,
          passengerCount: passengerList.length,
          totalRevenue,
        });
        qrCodeData = JSON.stringify({
          type: 'PARK_MANIFEST',
          id: manifestNumber,
          t: this.tenantId,
          v: verificationHash.substring(0, 12),
          demo: request.isDemo ?? false,
        });
      }

      const serialNumber = await this.generateSerialNumber();

      const manifest = await prisma.park_manifest.create({
        data: {
          tenantId: this.tenantId,
          tripId: request.tripId,
          parkId: request.parkId,
          manifestNumber,
          serialNumber,
          routeName: route.name,
          origin: route.origin,
          destination: route.destination,
          departureMode: trip.departureMode,
          scheduledDeparture: trip.scheduledDeparture,
          vehiclePlateNumber: trip.vehicle?.plateNumber || null,
          vehicleMake: trip.vehicle?.make || null,
          vehicleModel: trip.vehicle?.model || null,
          driverName: trip.driver?.fullName || null,
          driverPhone: trip.driver?.phone || null,
          totalSeats: trip.totalSeats,
          bookedSeats: trip.bookedSeats,
          availableSeats: trip.availableSeats,
          passengerList: passengerList as unknown as object,
          totalRevenue,
          cashAmount,
          cardAmount,
          transferAmount,
          status: 'GENERATED',
          syncStatus: isOfflineSync ? 'SYNCED' : 'SYNCED',
          verificationHash,
          qrCodeData,
          isDemo: request.isDemo ?? false,
          generatedById: request.generatedById || null,
          generatedByName: request.generatedByName || null,
          generatedAt: request.offlineGeneratedAt || new Date(),
          parkName: request.parkName || null,
          parkLocation: request.parkLocation || null,
          parkPhone: request.parkPhone || null,
        },
      });

      await prisma.park_manifest_revision.create({
        data: {
          tenantId: this.tenantId,
          manifestId: manifest.id,
          revisionNumber: 1,
          revisionType: 'INITIAL',
          reason: 'Initial manifest generation',
          createdById: request.generatedById || 'system',
          createdByName: request.generatedByName || 'System',
        },
      });

      return {
        success: true,
        manifest: this.mapToManifestData(manifest as PrismaManifest),
      };
    } catch (error) {
      console.error('[ManifestService] Generate error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate manifest',
      };
    }
  }

  async getManifest(manifestId: string): Promise<ManifestData | null> {
    const manifest = await prisma.park_manifest.findFirst({
      where: {
        id: manifestId,
        tenantId: this.tenantId,
      },
    });

    if (!manifest) return null;
    return this.mapToManifestData(manifest as PrismaManifest);
  }

  async getManifestByTrip(tripId: string): Promise<ManifestData | null> {
    const manifest = await prisma.park_manifest.findFirst({
      where: {
        tripId,
        tenantId: this.tenantId,
      },
    });

    if (!manifest) return null;
    return this.mapToManifestData(manifest as PrismaManifest);
  }

  async getManifestByNumber(manifestNumber: string): Promise<ManifestData | null> {
    const manifest = await prisma.park_manifest.findFirst({
      where: {
        manifestNumber,
        tenantId: this.tenantId,
      },
    });

    if (!manifest) return null;
    return this.mapToManifestData(manifest as PrismaManifest);
  }

  async recordPrint(
    manifestId: string,
    printedById: string,
    printedByName: string,
    reason?: string
  ): Promise<PrintManifestResult> {
    try {
      const manifest = await prisma.park_manifest.findFirst({
        where: {
          id: manifestId,
          tenantId: this.tenantId,
        },
      });

      if (!manifest) {
        return { success: false, error: 'Manifest not found or access denied' };
      }

      const revisionCount = await prisma.park_manifest_revision.count({
        where: { manifestId },
      });

      const revision = await prisma.park_manifest_revision.create({
        data: {
          tenantId: this.tenantId,
          manifestId,
          revisionNumber: revisionCount + 1,
          revisionType: manifest.printCount === 0 ? 'INITIAL' : 'REPRINT',
          reason: reason || (manifest.printCount === 0 ? 'First print' : 'Reprint requested'),
          createdById: printedById,
          createdByName: printedByName,
          wasPrinted: true,
          printedAt: new Date(),
        },
      });

      const updated = await prisma.park_manifest.update({
        where: { id: manifestId },
        data: {
          status: 'PRINTED',
          printCount: { increment: 1 },
          lastPrintedAt: new Date(),
          lastPrintedById: printedById,
          lastPrintedByName: printedByName,
        },
      });

      return {
        success: true,
        manifest: this.mapToManifestData(updated as PrismaManifest),
        revisionId: revision.id,
      };
    } catch (error) {
      console.error('[ManifestService] Print error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record print',
      };
    }
  }

  async updateStatus(
    manifestId: string,
    status: ManifestStatus,
    updatedById?: string,
    updatedByName?: string
  ): Promise<ManifestData | null> {
    try {
      const manifest = await prisma.park_manifest.findFirst({
        where: {
          id: manifestId,
          tenantId: this.tenantId,
        },
      });

      if (!manifest) return null;

      const updated = await prisma.park_manifest.update({
        where: { id: manifestId },
        data: { status },
      });

      if (status === 'VOIDED') {
        const revisionCount = await prisma.park_manifest_revision.count({
          where: { manifestId },
        });

        await prisma.park_manifest_revision.create({
          data: {
            tenantId: this.tenantId,
            manifestId,
            revisionNumber: revisionCount + 1,
            revisionType: 'VOID',
            reason: 'Manifest voided',
            createdById: updatedById || 'system',
            createdByName: updatedByName || 'System',
          },
        });
      }

      return this.mapToManifestData(updated as PrismaManifest);
    } catch (error) {
      console.error('[ManifestService] Update status error:', error);
      return null;
    }
  }

  async listManifests(options: {
    parkId?: string;
    status?: ManifestStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ manifests: ManifestListItem[]; total: number }> {
    const where: Record<string, unknown> = {
      tenantId: this.tenantId,
    };

    if (options.parkId) where.parkId = options.parkId;
    if (options.status) where.status = options.status;
    if (options.startDate || options.endDate) {
      where.generatedAt = {};
      if (options.startDate) (where.generatedAt as Record<string, unknown>).gte = options.startDate;
      if (options.endDate) (where.generatedAt as Record<string, unknown>).lte = options.endDate;
    }

    const [manifests, total] = await Promise.all([
      prisma.park_manifest.findMany({
        where,
        orderBy: { generatedAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
        select: {
          id: true,
          manifestNumber: true,
          routeName: true,
          origin: true,
          destination: true,
          scheduledDeparture: true,
          status: true,
          syncStatus: true,
          bookedSeats: true,
          totalSeats: true,
          printCount: true,
          generatedAt: true,
          isDemo: true,
        },
      }),
      prisma.park_manifest.count({ where }),
    ]);

    return {
      manifests: manifests.map((m: { id: string; manifestNumber: string; routeName: string; origin: string; destination: string; scheduledDeparture: Date | null; status: string; syncStatus: string; bookedSeats: number; totalSeats: number; printCount: number; generatedAt: Date | null; isDemo: boolean }) => ({
        ...m,
        status: m.status as ManifestStatus,
        syncStatus: m.syncStatus as ManifestSyncStatus,
      })),
      total,
    };
  }

  async getRevisions(manifestId: string): Promise<ManifestRevision[]> {
    const manifest = await prisma.park_manifest.findFirst({
      where: {
        id: manifestId,
        tenantId: this.tenantId,
      },
      select: { id: true },
    });

    if (!manifest) return [];

    const revisions = await prisma.park_manifest_revision.findMany({
      where: { manifestId },
      orderBy: { revisionNumber: 'asc' },
    });

    return revisions.map((r: { id: string; revisionNumber: number; revisionType: string; reason: string | null; changesSummary: string | null; createdById: string; createdByName: string; createdAt: Date; wasPrinted: boolean; printedAt: Date | null }) => ({
      id: r.id,
      revisionNumber: r.revisionNumber,
      revisionType: r.revisionType as 'INITIAL' | 'REPRINT' | 'CORRECTION' | 'VOID',
      reason: r.reason,
      changesSummary: r.changesSummary,
      createdById: r.createdById,
      createdByName: r.createdByName,
      createdAt: r.createdAt,
      wasPrinted: r.wasPrinted,
      printedAt: r.printedAt,
    }));
  }

  async verifyManifest(manifestNumber: string, hash?: string): Promise<VerifyManifestResult> {
    const manifest = await prisma.park_manifest.findFirst({
      where: { manifestNumber },
      select: {
        manifestNumber: true,
        routeName: true,
        origin: true,
        destination: true,
        scheduledDeparture: true,
        status: true,
        syncStatus: true,
        isDemo: true,
        bookedSeats: true,
        totalSeats: true,
        generatedAt: true,
        parkName: true,
        verificationHash: true,
      },
    });

    if (!manifest) {
      return { valid: false, error: 'Manifest not found' };
    }

    if (hash && manifest.verificationHash) {
      const hashValid = hash === manifest.verificationHash.substring(0, 12);
      if (!hashValid) {
        return { valid: false, error: 'Invalid verification code' };
      }
    }

    return {
      valid: true,
      manifest: {
        ...manifest,
        status: manifest.status as ManifestStatus,
        syncStatus: manifest.syncStatus as ManifestSyncStatus,
      },
    };
  }

  private async generateManifestNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const count = await prisma.park_manifest.count({
      where: {
        tenantId: this.tenantId,
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        },
      },
    });

    const sequence = (count + 1).toString().padStart(5, '0');
    return `MNF-${this.tenantId}-${dateStr}-${sequence}`;
  }

  private async generateSerialNumber(): Promise<string> {
    const count = await prisma.park_manifest.count({
      where: { tenantId: this.tenantId },
    });

    return (count + 1).toString().padStart(8, '0');
  }

  private generateVerificationHash(data: {
    manifestNumber: string;
    tripId: string;
    tenantId: string;
    passengerCount: number;
    totalRevenue: number;
  }): string {
    const payload = `${data.manifestNumber}:${data.tripId}:${data.tenantId}:${data.passengerCount}:${data.totalRevenue}`;
    return createHash('sha256').update(payload).digest('hex');
  }

  private mapToManifestData(manifest: PrismaManifest): ManifestData {
    const toNumber = (val: { toNumber(): number } | number): number => {
      if (typeof val === 'number') return val;
      return val.toNumber();
    };

    return {
      id: manifest.id,
      tenantId: manifest.tenantId,
      tripId: manifest.tripId,
      parkId: manifest.parkId,
      manifestNumber: manifest.manifestNumber,
      serialNumber: manifest.serialNumber,
      routeName: manifest.routeName,
      origin: manifest.origin,
      destination: manifest.destination,
      departureMode: manifest.departureMode,
      scheduledDeparture: manifest.scheduledDeparture,
      vehiclePlateNumber: manifest.vehiclePlateNumber,
      vehicleMake: manifest.vehicleMake,
      vehicleModel: manifest.vehicleModel,
      driverName: manifest.driverName,
      driverPhone: manifest.driverPhone,
      totalSeats: manifest.totalSeats,
      bookedSeats: manifest.bookedSeats,
      availableSeats: manifest.availableSeats,
      passengerList: manifest.passengerList as ManifestPassenger[],
      totalRevenue: toNumber(manifest.totalRevenue),
      cashAmount: toNumber(manifest.cashAmount),
      cardAmount: toNumber(manifest.cardAmount),
      transferAmount: toNumber(manifest.transferAmount),
      status: manifest.status as ManifestStatus,
      syncStatus: manifest.syncStatus as ManifestSyncStatus,
      verificationHash: manifest.verificationHash,
      qrCodeData: manifest.qrCodeData,
      isDemo: manifest.isDemo,
      generatedById: manifest.generatedById,
      generatedByName: manifest.generatedByName,
      generatedAt: manifest.generatedAt,
      printCount: manifest.printCount,
      lastPrintedAt: manifest.lastPrintedAt,
      lastPrintedById: manifest.lastPrintedById,
      lastPrintedByName: manifest.lastPrintedByName,
      parkName: manifest.parkName,
      parkLocation: manifest.parkLocation,
      parkPhone: manifest.parkPhone,
      createdAt: manifest.createdAt,
      updatedAt: manifest.updatedAt,
    };
  }
}

export function createManifestService(tenantId: string): ManifestService {
  return new ManifestService(tenantId);
}
