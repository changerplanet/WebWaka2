/**
 * PARKHUB SERVICE
 * Wave 1: Nigeria-First Modular Commerce
 * 
 * Walk-up POS interface, dynamic departure model ("leaves when full"),
 * and offline-first ticket sales for Nigerian motor parks.
 */

import { prisma } from '@/lib/prisma';
import { ParkTripDepartureMode, ParkTripStatus } from '@prisma/client';

export interface CreateTripInput {
  routeId: string;
  vehicleId?: string;
  driverId?: string;
  departureMode: ParkTripDepartureMode;
  scheduledDeparture?: Date;
  totalSeats: number;
  departureThreshold?: number;
  basePrice: number;
}

export interface SellTicketInput {
  tripId: string;
  passengerName: string;
  passengerPhone?: string;
  seatNumber?: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'POS_CARD';
  soldById: string;
  soldByName: string;
  discount?: number;
  roundingMode?: 'N5' | 'N10' | 'N50';
  offlineSaleId?: string;
}

export interface TripSummary {
  tripId: string;
  tripNumber: string;
  status: ParkTripStatus;
  departureMode: ParkTripDepartureMode;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  readyToDepart: boolean;
  currentPrice: number;
}

export class ParkHubService {
  /**
   * Create a new trip
   */
  static async createTrip(tenantId: string, input: CreateTripInput) {
    const tripNumber = await this.generateTripNumber(tenantId);

    return prisma.park_trip.create({
      data: {
        tenantId,
        tripNumber,
        routeId: input.routeId,
        vehicleId: input.vehicleId,
        driverId: input.driverId,
        departureMode: input.departureMode,
        scheduledDeparture: input.scheduledDeparture,
        totalSeats: input.totalSeats,
        bookedSeats: 0,
        availableSeats: input.totalSeats,
        departureThreshold: input.departureThreshold || input.totalSeats,
        basePrice: input.basePrice,
        currentPrice: input.basePrice,
        status: 'SCHEDULED',
      }
    });
  }

  /**
   * Get available trips for a route (for booking/POS)
   */
  static async getAvailableTrips(
    tenantId: string,
    routeId?: string,
    options?: { limit?: number }
  ) {
    const { limit = 20 } = options || {};

    return prisma.park_trip.findMany({
      where: {
        tenantId,
        ...(routeId && { routeId }),
        status: { in: ['SCHEDULED', 'BOARDING'] },
        availableSeats: { gt: 0 }
      },
      orderBy: [
        { scheduledDeparture: 'asc' },
        { createdAt: 'asc' }
      ],
      take: limit
    });
  }

  /**
   * Sell a ticket (walk-up POS - 3 taps max)
   */
  static async sellTicket(tenantId: string, input: SellTicketInput) {
    const trip = await prisma.park_trip.findUnique({
      where: { id: input.tripId }
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    if (trip.availableSeats <= 0) {
      throw new Error('No seats available');
    }

    if (!['SCHEDULED', 'BOARDING'].includes(trip.status)) {
      throw new Error(`Cannot sell tickets for ${trip.status} trip`);
    }

    const ticketNumber = await this.generateTicketNumber(tenantId);
    const basePrice = Number(trip.currentPrice);
    const discount = input.discount || 0;
    const subtotal = basePrice - discount;

    let roundingAmount = 0;
    let roundedTotal = subtotal;

    if (input.roundingMode) {
      const roundingValue = parseInt(input.roundingMode.replace('N', ''));
      roundedTotal = Math.round(subtotal / roundingValue) * roundingValue;
      roundingAmount = roundedTotal - subtotal;
    }

    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.park_ticket.create({
        data: {
          tenantId,
          tripId: input.tripId,
          ticketNumber,
          seatNumber: input.seatNumber,
          passengerName: input.passengerName,
          passengerPhone: input.passengerPhone,
          price: basePrice,
          discount,
          totalPaid: roundedTotal,
          roundingAmount,
          roundingMode: input.roundingMode,
          paymentMethod: input.paymentMethod,
          paymentStatus: 'PAID',
          saleChannel: 'WALK_UP',
          soldById: input.soldById,
          soldByName: input.soldByName,
          offlineSaleId: input.offlineSaleId,
          syncedAt: input.offlineSaleId ? null : new Date(),
          status: 'ACTIVE',
        }
      });

      const updatedTrip = await tx.park_trip.update({
        where: { id: input.tripId },
        data: {
          bookedSeats: { increment: 1 },
          availableSeats: { decrement: 1 },
        }
      });

      const readyToDepart = this.checkReadyToDepart(updatedTrip);
      
      if (readyToDepart && updatedTrip.status === 'SCHEDULED') {
        await tx.park_trip.update({
          where: { id: input.tripId },
          data: { status: 'READY_TO_DEPART' }
        });
      }

      return { ticket, trip: updatedTrip, readyToDepart };
    });

    return result;
  }

  /**
   * Check if trip is ready to depart (for "leaves when full" mode)
   */
  private static checkReadyToDepart(trip: {
    departureMode: ParkTripDepartureMode;
    bookedSeats: number;
    totalSeats: number;
    departureThreshold: number | null;
    scheduledDeparture: Date | null;
  }): boolean {
    const threshold = trip.departureThreshold || trip.totalSeats;

    switch (trip.departureMode) {
      case 'WHEN_FULL':
        return trip.bookedSeats >= threshold;
      
      case 'HYBRID':
        const isCapacityMet = trip.bookedSeats >= threshold;
        const isTimePassed = trip.scheduledDeparture 
          ? new Date() >= trip.scheduledDeparture 
          : false;
        return isCapacityMet || isTimePassed;
      
      case 'SCHEDULED':
      default:
        return trip.scheduledDeparture 
          ? new Date() >= trip.scheduledDeparture 
          : false;
    }
  }

  /**
   * Get trip summary (for agent dashboard)
   */
  static async getTripSummary(tripId: string): Promise<TripSummary | null> {
    const trip = await prisma.park_trip.findUnique({
      where: { id: tripId }
    });

    if (!trip) return null;

    return {
      tripId: trip.id,
      tripNumber: trip.tripNumber,
      status: trip.status,
      departureMode: trip.departureMode,
      totalSeats: trip.totalSeats,
      bookedSeats: trip.bookedSeats,
      availableSeats: trip.availableSeats,
      readyToDepart: this.checkReadyToDepart(trip),
      currentPrice: Number(trip.currentPrice),
    };
  }

  /**
   * Update trip status (lifecycle)
   */
  static async updateTripStatus(
    tripId: string,
    newStatus: ParkTripStatus,
    agentId?: string,
    agentName?: string
  ) {
    const trip = await prisma.park_trip.findUnique({
      where: { id: tripId }
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    const validTransitions: Record<ParkTripStatus, ParkTripStatus[]> = {
      'SCHEDULED': ['BOARDING', 'CANCELLED'],
      'BOARDING': ['READY_TO_DEPART', 'DEPARTED', 'CANCELLED'],
      'READY_TO_DEPART': ['DEPARTED', 'CANCELLED'],
      'DEPARTED': ['IN_TRANSIT'],
      'IN_TRANSIT': ['ARRIVED'],
      'ARRIVED': ['COMPLETED'],
      'COMPLETED': [],
      'CANCELLED': [],
    };

    if (!validTransitions[trip.status].includes(newStatus)) {
      throw new Error(`Invalid status transition: ${trip.status} → ${newStatus}`);
    }

    return prisma.park_trip.update({
      where: { id: tripId },
      data: {
        status: newStatus,
        ...(newStatus === 'DEPARTED' && { actualDeparture: new Date() }),
        ...(newStatus === 'ARRIVED' && { actualArrival: new Date() }),
        ...(newStatus === 'BOARDING' && agentId && {
          boardingAgentId: agentId,
          boardingAgentName: agentName,
        }),
      }
    });
  }

  /**
   * Start boarding (agent action)
   */
  static async startBoarding(tripId: string, agentId: string, agentName: string) {
    return this.updateTripStatus(tripId, 'BOARDING', agentId, agentName);
  }

  /**
   * Depart trip
   */
  static async departTrip(tripId: string) {
    return this.updateTripStatus(tripId, 'DEPARTED');
  }

  /**
   * Get trip manifest (passenger list)
   */
  static async getTripManifest(tripId: string) {
    const trip = await prisma.park_trip.findUnique({
      where: { id: tripId },
      include: {
        tickets: {
          where: { status: { in: ['ACTIVE', 'BOARDED'] } },
          orderBy: { seatNumber: 'asc' }
        }
      }
    });

    if (!trip) return null;

    return {
      tripNumber: trip.tripNumber,
      status: trip.status,
      totalPassengers: trip.bookedSeats,
      passengers: trip.tickets.map(t => ({
        ticketNumber: t.ticketNumber,
        seatNumber: t.seatNumber,
        passengerName: t.passengerName,
        passengerPhone: t.passengerPhone,
        status: t.status,
      }))
    };
  }

  /**
   * Cancel ticket (refund)
   */
  static async cancelTicket(ticketId: string, reason?: string) {
    const ticket = await prisma.park_ticket.findUnique({
      where: { id: ticketId },
      include: { trip: true }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (!['SCHEDULED', 'BOARDING'].includes(ticket.trip.status)) {
      throw new Error('Cannot cancel ticket after departure');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.park_ticket.update({
        where: { id: ticketId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED',
        }
      });

      await tx.park_trip.update({
        where: { id: ticket.tripId },
        data: {
          bookedSeats: { decrement: 1 },
          availableSeats: { increment: 1 },
        }
      });

      return updated;
    });
  }

  /**
   * Get today's trips for agent dashboard
   */
  static async getTodaysTrips(tenantId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.park_trip.findMany({
      where: {
        tenantId,
        OR: [
          {
            scheduledDeparture: {
              gte: startOfDay,
              lte: endOfDay
            }
          },
          {
            status: { in: ['BOARDING', 'READY_TO_DEPART'] }
          }
        ]
      },
      orderBy: [
        { status: 'asc' },
        { scheduledDeparture: 'asc' }
      ]
    });
  }

  private static async generateTripNumber(tenantId: string): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.park_trip.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    return `TRIP-${today}-${String(count + 1).padStart(4, '0')}`;
  }

  private static async generateTicketNumber(tenantId: string): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.park_ticket.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    return `TKT-${today}-${String(count + 1).padStart(5, '0')}`;
  }
}
