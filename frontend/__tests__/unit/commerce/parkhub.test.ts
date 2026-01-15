/**
 * PARKHUB TRIP LOGIC TESTS
 * Wave 1.5: Test Hardening
 * 
 * Tests WHEN_FULL departure mode, seat depletion,
 * and trip auto-close behavior.
 */

import { ParkHubService, CreateTripInput, SellTicketInput } from '@/lib/commerce/parkhub/parkhub-service';
import { prisma } from '@/lib/prisma';
import { ParkTripDepartureMode, ParkTripStatus } from '@prisma/client';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    park_trip: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    park_ticket: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

describe('ParkHubService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTenantId = 'tenant-123';

  describe('Trip Creation', () => {
    it('should create trip with SCHEDULED departure mode', async () => {
      const tripInput: CreateTripInput = {
        routeId: 'route-1',
        departureMode: 'SCHEDULED',
        scheduledDeparture: new Date('2026-01-15T10:00:00Z'),
        totalSeats: 14,
        basePrice: 5000,
      };

      (prisma.park_trip.count as jest.Mock).mockResolvedValue(0);
      (prisma.park_trip.create as jest.Mock).mockResolvedValue({
        id: 'trip-1',
        tripNumber: 'TRIP-20260115-0001',
        departureMode: 'SCHEDULED',
        totalSeats: 14,
        bookedSeats: 0,
        availableSeats: 14,
        status: 'SCHEDULED',
      });

      const trip = await ParkHubService.createTrip(mockTenantId, tripInput);

      expect(trip.status).toBe('SCHEDULED');
      expect(trip.availableSeats).toBe(14);
    });

    it('should create trip with WHEN_FULL departure mode', async () => {
      const tripInput: CreateTripInput = {
        routeId: 'route-1',
        departureMode: 'WHEN_FULL',
        totalSeats: 18,
        basePrice: 4500,
      };

      (prisma.park_trip.count as jest.Mock).mockResolvedValue(0);
      (prisma.park_trip.create as jest.Mock).mockResolvedValue({
        id: 'trip-1',
        tripNumber: 'TRIP-20260115-0001',
        departureMode: 'WHEN_FULL',
        totalSeats: 18,
        bookedSeats: 0,
        availableSeats: 18,
        status: 'SCHEDULED',
      });

      const trip = await ParkHubService.createTrip(mockTenantId, tripInput);

      expect(trip.departureMode).toBe('WHEN_FULL');
    });

    it('should set departure threshold when provided', async () => {
      const tripInput: CreateTripInput = {
        routeId: 'route-1',
        departureMode: 'WHEN_FULL',
        totalSeats: 18,
        departureThreshold: 15,
        basePrice: 4500,
      };

      (prisma.park_trip.count as jest.Mock).mockResolvedValue(0);
      (prisma.park_trip.create as jest.Mock).mockResolvedValue({
        id: 'trip-1',
        departureThreshold: 15,
      });

      await ParkHubService.createTrip(mockTenantId, tripInput);

      expect(prisma.park_trip.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          departureThreshold: 15,
        }),
      });
    });
  });

  describe('WHEN_FULL Departure Mode', () => {
    it('should not trigger departure below threshold', async () => {
      const mockTrip = {
        id: 'trip-1',
        tenantId: mockTenantId,
        departureMode: 'WHEN_FULL' as ParkTripDepartureMode,
        totalSeats: 18,
        bookedSeats: 10,
        availableSeats: 8,
        departureThreshold: 18,
        status: 'SCHEDULED' as ParkTripStatus,
        currentPrice: 5000,
        scheduledDeparture: null,
      };

      (prisma.park_trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
      (prisma.park_ticket.count as jest.Mock).mockResolvedValue(0);
      (prisma.park_ticket.create as jest.Mock).mockResolvedValue({
        id: 'ticket-1',
        ticketNumber: 'TKT-20260115-00001',
      });
      (prisma.park_trip.update as jest.Mock).mockResolvedValue({
        ...mockTrip,
        bookedSeats: 11,
        availableSeats: 7,
      });

      const result = await ParkHubService.sellTicket(mockTenantId, {
        tripId: 'trip-1',
        passengerName: 'Test Passenger',
        paymentMethod: 'CASH',
        soldById: 'agent-1',
        soldByName: 'Agent Name',
      });

      expect(result.readyToDepart).toBe(false);
    });

    it('should trigger READY_TO_DEPART when threshold met', async () => {
      const mockTrip = {
        id: 'trip-1',
        tenantId: mockTenantId,
        departureMode: 'WHEN_FULL' as ParkTripDepartureMode,
        totalSeats: 18,
        bookedSeats: 17,
        availableSeats: 1,
        departureThreshold: 18,
        status: 'SCHEDULED' as ParkTripStatus,
        currentPrice: 5000,
        scheduledDeparture: null,
      };

      const updatedTrip = {
        ...mockTrip,
        bookedSeats: 18,
        availableSeats: 0,
      };

      (prisma.park_trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
      (prisma.park_ticket.count as jest.Mock).mockResolvedValue(0);
      (prisma.park_ticket.create as jest.Mock).mockResolvedValue({
        id: 'ticket-1',
        ticketNumber: 'TKT-20260115-00001',
      });
      (prisma.park_trip.update as jest.Mock).mockResolvedValue(updatedTrip);

      const result = await ParkHubService.sellTicket(mockTenantId, {
        tripId: 'trip-1',
        passengerName: 'Final Passenger',
        paymentMethod: 'CASH',
        soldById: 'agent-1',
        soldByName: 'Agent Name',
      });

      expect(result.readyToDepart).toBe(true);
    });

    it('should use custom threshold when set below total seats', async () => {
      const mockTrip = {
        id: 'trip-1',
        tenantId: mockTenantId,
        departureMode: 'WHEN_FULL' as ParkTripDepartureMode,
        totalSeats: 18,
        bookedSeats: 14,
        availableSeats: 4,
        departureThreshold: 15,
        status: 'SCHEDULED' as ParkTripStatus,
        currentPrice: 5000,
        scheduledDeparture: null,
      };

      const updatedTrip = {
        ...mockTrip,
        bookedSeats: 15,
        availableSeats: 3,
      };

      (prisma.park_trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
      (prisma.park_ticket.count as jest.Mock).mockResolvedValue(0);
      (prisma.park_ticket.create as jest.Mock).mockResolvedValue({
        id: 'ticket-1',
        ticketNumber: 'TKT-20260115-00001',
      });
      (prisma.park_trip.update as jest.Mock).mockResolvedValue(updatedTrip);

      const result = await ParkHubService.sellTicket(mockTenantId, {
        tripId: 'trip-1',
        passengerName: 'Threshold Passenger',
        paymentMethod: 'CASH',
        soldById: 'agent-1',
        soldByName: 'Agent Name',
      });

      expect(result.readyToDepart).toBe(true);
    });
  });

  describe('HYBRID Departure Mode', () => {
    it('should trigger departure when capacity met before time', async () => {
      const mockTrip = {
        id: 'trip-1',
        tenantId: mockTenantId,
        departureMode: 'HYBRID' as ParkTripDepartureMode,
        totalSeats: 18,
        bookedSeats: 17,
        availableSeats: 1,
        departureThreshold: 18,
        status: 'SCHEDULED' as ParkTripStatus,
        currentPrice: 5000,
        scheduledDeparture: new Date(Date.now() + 3600000),
      };

      const updatedTrip = {
        ...mockTrip,
        bookedSeats: 18,
        availableSeats: 0,
      };

      (prisma.park_trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
      (prisma.park_ticket.count as jest.Mock).mockResolvedValue(0);
      (prisma.park_ticket.create as jest.Mock).mockResolvedValue({ id: 'ticket-1' });
      (prisma.park_trip.update as jest.Mock).mockResolvedValue(updatedTrip);

      const result = await ParkHubService.sellTicket(mockTenantId, {
        tripId: 'trip-1',
        passengerName: 'Passenger',
        paymentMethod: 'CASH',
        soldById: 'agent-1',
        soldByName: 'Agent Name',
      });

      expect(result.readyToDepart).toBe(true);
    });
  });

  describe('Seat Depletion', () => {
    it('should decrement available seats on ticket sale', async () => {
      const mockTrip = {
        id: 'trip-1',
        tenantId: mockTenantId,
        departureMode: 'SCHEDULED' as ParkTripDepartureMode,
        totalSeats: 14,
        bookedSeats: 5,
        availableSeats: 9,
        departureThreshold: 14,
        status: 'BOARDING' as ParkTripStatus,
        currentPrice: 5000,
        scheduledDeparture: null,
      };

      (prisma.park_trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
      (prisma.park_ticket.count as jest.Mock).mockResolvedValue(0);
      (prisma.park_ticket.create as jest.Mock).mockResolvedValue({ id: 'ticket-1' });
      (prisma.park_trip.update as jest.Mock).mockResolvedValue({
        ...mockTrip,
        bookedSeats: 6,
        availableSeats: 8,
      });

      await ParkHubService.sellTicket(mockTenantId, {
        tripId: 'trip-1',
        passengerName: 'Passenger',
        paymentMethod: 'CASH',
        soldById: 'agent-1',
        soldByName: 'Agent Name',
      });

      expect(prisma.park_trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-1' },
        data: {
          bookedSeats: { increment: 1 },
          availableSeats: { decrement: 1 },
        },
      });
    });

    it('should reject sale when no seats available', async () => {
      const mockTrip = {
        id: 'trip-1',
        tenantId: mockTenantId,
        availableSeats: 0,
        status: 'BOARDING' as ParkTripStatus,
      };

      (prisma.park_trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);

      await expect(
        ParkHubService.sellTicket(mockTenantId, {
          tripId: 'trip-1',
          passengerName: 'Passenger',
          paymentMethod: 'CASH',
          soldById: 'agent-1',
          soldByName: 'Agent Name',
        })
      ).rejects.toThrow('No seats available');
    });

    it('should increment available seats on ticket cancellation', async () => {
      const mockTicket = {
        id: 'ticket-1',
        tripId: 'trip-1',
        status: 'ACTIVE',
        trip: {
          status: 'BOARDING',
        },
      };

      (prisma.park_ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
      (prisma.park_ticket.update as jest.Mock).mockResolvedValue({
        ...mockTicket,
        status: 'CANCELLED',
      });
      (prisma.park_trip.update as jest.Mock).mockResolvedValue({});

      await ParkHubService.cancelTicket('ticket-1');

      expect(prisma.park_trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-1' },
        data: {
          bookedSeats: { decrement: 1 },
          availableSeats: { increment: 1 },
        },
      });
    });
  });

  describe('Trip Status Lifecycle', () => {
    it('should allow SCHEDULED → BOARDING transition', async () => {
      (prisma.park_trip.findUnique as jest.Mock).mockResolvedValue({
        id: 'trip-1',
        status: 'SCHEDULED',
      });
      (prisma.park_trip.update as jest.Mock).mockResolvedValue({
        id: 'trip-1',
        status: 'BOARDING',
      });

      const trip = await ParkHubService.startBoarding('trip-1', 'agent-1', 'Agent Name');

      expect(trip.status).toBe('BOARDING');
    });

    it('should allow BOARDING → DEPARTED transition', async () => {
      (prisma.park_trip.findUnique as jest.Mock).mockResolvedValue({
        id: 'trip-1',
        status: 'BOARDING',
      });
      (prisma.park_trip.update as jest.Mock).mockResolvedValue({
        id: 'trip-1',
        status: 'DEPARTED',
      });

      const trip = await ParkHubService.departTrip('trip-1');

      expect(trip.status).toBe('DEPARTED');
    });

    it('should reject invalid status transition', async () => {
      (prisma.park_trip.findUnique as jest.Mock).mockResolvedValue({
        id: 'trip-1',
        status: 'COMPLETED',
      });

      await expect(
        ParkHubService.updateTripStatus('trip-1', 'BOARDING')
      ).rejects.toThrow('Invalid status transition');
    });

    it('should reject ticket sale for DEPARTED trip', async () => {
      (prisma.park_trip.findUnique as jest.Mock).mockResolvedValue({
        id: 'trip-1',
        status: 'DEPARTED',
        availableSeats: 5,
      });

      await expect(
        ParkHubService.sellTicket(mockTenantId, {
          tripId: 'trip-1',
          passengerName: 'Late Passenger',
          paymentMethod: 'CASH',
          soldById: 'agent-1',
          soldByName: 'Agent Name',
        })
      ).rejects.toThrow('Cannot sell tickets for DEPARTED trip');
    });

    it('should set actualDeparture timestamp on DEPARTED', async () => {
      (prisma.park_trip.findUnique as jest.Mock).mockResolvedValue({
        id: 'trip-1',
        status: 'READY_TO_DEPART',
      });
      (prisma.park_trip.update as jest.Mock).mockResolvedValue({
        id: 'trip-1',
        status: 'DEPARTED',
      });

      await ParkHubService.updateTripStatus('trip-1', 'DEPARTED');

      expect(prisma.park_trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-1' },
        data: expect.objectContaining({
          actualDeparture: expect.any(Date),
        }),
      });
    });

    it('should reject ticket cancellation after departure', async () => {
      const mockTicket = {
        id: 'ticket-1',
        tripId: 'trip-1',
        trip: {
          status: 'DEPARTED',
        },
      };

      (prisma.park_ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);

      await expect(
        ParkHubService.cancelTicket('ticket-1')
      ).rejects.toThrow('Cannot cancel ticket after departure');
    });
  });

  describe('Trip Summary', () => {
    it('should return correct trip summary', async () => {
      (prisma.park_trip.findUnique as jest.Mock).mockResolvedValue({
        id: 'trip-1',
        tripNumber: 'TRIP-20260115-0001',
        status: 'BOARDING',
        departureMode: 'WHEN_FULL',
        totalSeats: 18,
        bookedSeats: 10,
        availableSeats: 8,
        departureThreshold: 18,
        currentPrice: 5000,
        scheduledDeparture: null,
      });

      const summary = await ParkHubService.getTripSummary('trip-1');

      expect(summary).toMatchObject({
        tripNumber: 'TRIP-20260115-0001',
        status: 'BOARDING',
        totalSeats: 18,
        bookedSeats: 10,
        availableSeats: 8,
        readyToDepart: false,
        currentPrice: 5000,
      });
    });

    it('should return null for non-existent trip', async () => {
      (prisma.park_trip.findUnique as jest.Mock).mockResolvedValue(null);

      const summary = await ParkHubService.getTripSummary('non-existent');

      expect(summary).toBeNull();
    });
  });

  describe('Trip Manifest', () => {
    it('should return passenger list for trip', async () => {
      (prisma.park_trip.findUnique as jest.Mock).mockResolvedValue({
        id: 'trip-1',
        tripNumber: 'TRIP-20260115-0001',
        status: 'BOARDING',
        bookedSeats: 3,
        tickets: [
          { ticketNumber: 'TKT-001', seatNumber: 'A1', passengerName: 'John', status: 'ACTIVE' },
          { ticketNumber: 'TKT-002', seatNumber: 'A2', passengerName: 'Jane', status: 'ACTIVE' },
          { ticketNumber: 'TKT-003', seatNumber: 'A3', passengerName: 'Bob', status: 'BOARDED' },
        ],
      });

      const manifest = await ParkHubService.getTripManifest('trip-1');

      expect(manifest).not.toBeNull();
      expect(manifest?.totalPassengers).toBe(3);
      expect(manifest?.passengers.length).toBe(3);
    });
  });
});
