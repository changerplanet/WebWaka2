/**
 * ParkHub SMS Integration
 * Wave F7: SMS Driver Updates
 * 
 * Integration layer between ParkHub operations and driver SMS notifications.
 * All notifications are USER-TRIGGERED only - NO automation.
 * 
 * This module provides convenience functions for common SMS scenarios
 * that can be called from the ParkHub admin interface.
 */

import { prisma } from '@/lib/prisma';
import { createDriverSmsService } from '@/lib/parkhub/sms';
import type { SendDriverSmsResult } from '@/lib/parkhub/sms/types';

interface NotificationContext {
  tenantId: string;
  sentById?: string;
  sentByName?: string;
  isDemo?: boolean;
}

/**
 * Notify driver of trip assignment
 * Call this when an operator assigns a driver to a trip
 */
export async function notifyDriverOfAssignment(
  tripId: string,
  context: NotificationContext
): Promise<SendDriverSmsResult> {
  const trip = await prisma.park_trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    return { success: false, error: 'Trip not found' };
  }

  if (!trip.driverId) {
    return { success: false, error: 'No driver assigned to this trip' };
  }

  const smsService = createDriverSmsService(context.tenantId);
  return smsService.notifyTripAssignment(
    trip.driverId,
    tripId,
    context.sentById,
    context.sentByName,
    context.isDemo
  );
}

/**
 * Notify driver that trip is ready to depart
 * Call this when trip reaches threshold or is marked ready
 */
export async function notifyDriverReadyToDepart(
  tripId: string,
  context: NotificationContext
): Promise<SendDriverSmsResult> {
  const trip = await prisma.park_trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    return { success: false, error: 'Trip not found' };
  }

  if (!trip.driverId) {
    return { success: false, error: 'No driver assigned to this trip' };
  }

  const smsService = createDriverSmsService(context.tenantId);
  return smsService.notifyReadyToDepart(
    trip.driverId,
    tripId,
    context.sentById,
    context.sentByName,
    context.isDemo
  );
}

/**
 * Send departure reminder to driver
 * Call this manually before scheduled departure time
 */
export async function sendDepartureReminder(
  tripId: string,
  context: NotificationContext
): Promise<SendDriverSmsResult> {
  const trip = await prisma.park_trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    return { success: false, error: 'Trip not found' };
  }

  if (!trip.driverId) {
    return { success: false, error: 'No driver assigned to this trip' };
  }

  const smsService = createDriverSmsService(context.tenantId);
  return smsService.notifyDepartureReminder(
    trip.driverId,
    tripId,
    context.sentById,
    context.sentByName,
    context.isDemo
  );
}

/**
 * Notify driver of trip status change
 * Call this when trip status changes significantly
 */
export async function notifyDriverOfStatusChange(
  tripId: string,
  context: NotificationContext
): Promise<SendDriverSmsResult> {
  const trip = await prisma.park_trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    return { success: false, error: 'Trip not found' };
  }

  if (!trip.driverId) {
    return { success: false, error: 'No driver assigned to this trip' };
  }

  const smsService = createDriverSmsService(context.tenantId);
  return smsService.notifyStatusChange(
    trip.driverId,
    tripId,
    context.sentById,
    context.sentByName,
    context.isDemo
  );
}

/**
 * Notify driver of trip cancellation
 * Call this when a trip is cancelled
 */
export async function notifyDriverOfCancellation(
  tripId: string,
  context: NotificationContext
): Promise<SendDriverSmsResult> {
  const trip = await prisma.park_trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    return { success: false, error: 'Trip not found' };
  }

  if (!trip.driverId) {
    return { success: false, error: 'No driver assigned to this trip' };
  }

  const smsService = createDriverSmsService(context.tenantId);
  return smsService.notifyCancellation(
    trip.driverId,
    tripId,
    context.sentById,
    context.sentByName,
    context.isDemo
  );
}

/**
 * Send custom message to driver
 * Call this for ad-hoc communications
 */
export async function sendCustomMessageToDriver(
  driverId: string,
  message: string,
  tripId: string | undefined,
  context: NotificationContext
): Promise<SendDriverSmsResult> {
  const smsService = createDriverSmsService(context.tenantId);
  return smsService.sendCustomMessage(
    driverId,
    message,
    tripId,
    context.sentById,
    context.sentByName,
    context.isDemo
  );
}

/**
 * Assign driver to trip and optionally send notification
 * User-triggered assignment with optional SMS
 */
export async function assignDriverToTrip(
  tripId: string,
  driverId: string,
  vehicleId: string | undefined,
  sendSmsNotification: boolean,
  context: NotificationContext
): Promise<{ trip: unknown; smsResult?: SendDriverSmsResult }> {
  const trip = await prisma.park_trip.update({
    where: { id: tripId },
    data: {
      driverId,
      vehicleId: vehicleId || null,
    },
  });

  let smsResult: SendDriverSmsResult | undefined;

  if (sendSmsNotification) {
    const smsService = createDriverSmsService(context.tenantId);
    smsResult = await smsService.notifyTripAssignment(
      driverId,
      tripId,
      context.sentById,
      context.sentByName,
      context.isDemo
    );
  }

  return { trip, smsResult };
}

/**
 * Get all active drivers for a park
 */
export async function getActiveDrivers(tenantId: string, parkId: string) {
  return prisma.park_driver.findMany({
    where: {
      tenantId,
      parkId,
      status: 'ACTIVE',
    },
    orderBy: { fullName: 'asc' },
  });
}

/**
 * Get all available vehicles for a park
 */
export async function getAvailableVehicles(tenantId: string, parkId: string) {
  return prisma.park_vehicle.findMany({
    where: {
      tenantId,
      parkId,
      status: 'AVAILABLE',
    },
    orderBy: { vehicleNumber: 'asc' },
  });
}

/**
 * Get driver by ID with SMS preferences
 */
export async function getDriverWithSmsPreferences(driverId: string) {
  return prisma.park_driver.findUnique({
    where: { id: driverId },
    select: {
      id: true,
      fullName: true,
      phone: true,
      prefersSmsNotifications: true,
      smsLanguage: true,
      status: true,
    },
  });
}

/**
 * Update driver SMS preferences
 */
export async function updateDriverSmsPreferences(
  driverId: string,
  prefersSmsNotifications: boolean,
  smsLanguage?: string
) {
  return prisma.park_driver.update({
    where: { id: driverId },
    data: {
      prefersSmsNotifications,
      ...(smsLanguage && { smsLanguage }),
    },
  });
}
