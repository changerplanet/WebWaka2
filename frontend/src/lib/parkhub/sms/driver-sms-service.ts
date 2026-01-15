/**
 * ParkHub Driver SMS Service
 * Wave F7: SMS Driver Updates
 * 
 * User-triggered SMS notifications for ParkHub drivers.
 * Feature-phone compatible - no apps required.
 * Supports Twilio integration for real SMS delivery.
 * 
 * NO automation, NO background jobs.
 * All SMS sends are explicitly triggered by park operators.
 */

import { prisma } from '@/lib/prisma';
import {
  DriverSmsType,
  SendDriverSmsInput,
  SendDriverSmsResult,
  DriverInfo,
  TripInfo,
  SmsLogEntry,
  DriverSmsHistory,
  SmsLanguage,
} from './types';
import { generateDriverSms } from './templates';

type SmsLog = {
  id: string;
  driverId: string;
  tripId: string | null;
  messageType: string;
  phoneNumber: string;
  messageContent: string;
  status: string;
  externalId: string | null;
  errorMessage: string | null;
  sentAt: Date | null;
  createdAt: Date;
};

export class DriverSmsService {
  constructor(private tenantId: string) {}

  /**
   * Send SMS notification to a driver
   * User-triggered only - no automation
   */
  async sendDriverSms(input: SendDriverSmsInput): Promise<SendDriverSmsResult> {
    try {
      const driver = await prisma.park_driver.findUnique({
        where: { id: input.driverId },
      });

      if (!driver) {
        return { success: false, error: 'Driver not found' };
      }

      if (driver.tenantId !== this.tenantId) {
        return { success: false, error: 'Driver does not belong to this tenant' };
      }

      if (!driver.prefersSmsNotifications) {
        return { 
          success: false, 
          error: 'Driver has SMS notifications disabled',
          message: 'Driver has opted out of SMS notifications'
        };
      }

      if (!driver.phone) {
        return { success: false, error: 'Driver has no phone number' };
      }

      let trip: TripInfo | undefined;
      if (input.tripId) {
        const tripData = await prisma.park_trip.findUnique({
          where: { id: input.tripId },
        });

        if (tripData) {
          const [route, vehicle] = await Promise.all([
            prisma.park_route.findFirst({
              where: { id: tripData.routeId },
            }),
            tripData.vehicleId 
              ? prisma.park_vehicle.findUnique({
                  where: { id: tripData.vehicleId },
                  select: { plateNumber: true },
                })
              : null,
          ]);

          trip = {
            id: tripData.id,
            tripNumber: tripData.tripNumber,
            routeName: route?.name || 'Unknown Route',
            origin: route?.origin || '',
            destination: route?.destination || '',
            scheduledDeparture: tripData.scheduledDeparture,
            departureMode: tripData.departureMode,
            totalSeats: tripData.totalSeats,
            bookedSeats: tripData.bookedSeats,
            status: tripData.status,
            vehiclePlateNumber: vehicle?.plateNumber,
          };
        }
      }

      const driverInfo: DriverInfo = {
        id: driver.id,
        fullName: driver.fullName,
        phone: driver.phone,
        prefersSmsNotifications: driver.prefersSmsNotifications,
        smsLanguage: (driver.smsLanguage as SmsLanguage) || 'en',
      };

      const messageContent = generateDriverSms(input.messageType, {
        driver: driverInfo,
        trip,
        customMessage: input.customMessage,
      });

      const smsLog = await prisma.park_driver_sms_log.create({
        data: {
          tenantId: this.tenantId,
          driverId: input.driverId,
          tripId: input.tripId || null,
          messageType: input.messageType,
          phoneNumber: driver.phone,
          messageContent,
          status: 'PENDING',
          sentById: input.sentById || null,
          sentByName: input.sentByName || null,
          isDemo: input.isDemo ?? false,
        },
      });

      const sendResult = await this.deliverSms(
        driver.phone,
        messageContent,
        input.isDemo ?? false
      );

      await prisma.park_driver_sms_log.update({
        where: { id: smsLog.id },
        data: {
          status: sendResult.success ? 'SENT' : 'FAILED',
          externalId: sendResult.externalId || null,
          errorMessage: sendResult.error || null,
          sentAt: sendResult.success ? new Date() : null,
        },
      });

      return {
        success: sendResult.success,
        smsLogId: smsLog.id,
        externalId: sendResult.externalId,
        error: sendResult.error,
        message: messageContent,
      };
    } catch (error) {
      console.error('Error sending driver SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send trip assignment notification
   */
  async notifyTripAssignment(
    driverId: string,
    tripId: string,
    sentById?: string,
    sentByName?: string,
    isDemo?: boolean
  ): Promise<SendDriverSmsResult> {
    return this.sendDriverSms({
      tenantId: this.tenantId,
      driverId,
      tripId,
      messageType: 'TRIP_ASSIGNMENT',
      sentById,
      sentByName,
      isDemo,
    });
  }

  /**
   * Send ready-to-depart notification (trip is full or threshold reached)
   */
  async notifyReadyToDepart(
    driverId: string,
    tripId: string,
    sentById?: string,
    sentByName?: string,
    isDemo?: boolean
  ): Promise<SendDriverSmsResult> {
    return this.sendDriverSms({
      tenantId: this.tenantId,
      driverId,
      tripId,
      messageType: 'READY_TO_DEPART',
      sentById,
      sentByName,
      isDemo,
    });
  }

  /**
   * Send departure reminder
   */
  async notifyDepartureReminder(
    driverId: string,
    tripId: string,
    sentById?: string,
    sentByName?: string,
    isDemo?: boolean
  ): Promise<SendDriverSmsResult> {
    return this.sendDriverSms({
      tenantId: this.tenantId,
      driverId,
      tripId,
      messageType: 'DEPARTURE_REMINDER',
      sentById,
      sentByName,
      isDemo,
    });
  }

  /**
   * Send status change notification
   */
  async notifyStatusChange(
    driverId: string,
    tripId: string,
    sentById?: string,
    sentByName?: string,
    isDemo?: boolean
  ): Promise<SendDriverSmsResult> {
    return this.sendDriverSms({
      tenantId: this.tenantId,
      driverId,
      tripId,
      messageType: 'STATUS_CHANGE',
      sentById,
      sentByName,
      isDemo,
    });
  }

  /**
   * Send cancellation notification
   */
  async notifyCancellation(
    driverId: string,
    tripId: string,
    sentById?: string,
    sentByName?: string,
    isDemo?: boolean
  ): Promise<SendDriverSmsResult> {
    return this.sendDriverSms({
      tenantId: this.tenantId,
      driverId,
      tripId,
      messageType: 'CANCELLATION',
      sentById,
      sentByName,
      isDemo,
    });
  }

  /**
   * Send custom message
   * Note: Custom messages also respect driver's prefersSmsNotifications setting
   * unless explicitly overridden with forceDelivery=true (admin-only use cases)
   */
  async sendCustomMessage(
    driverId: string,
    message: string,
    tripId?: string,
    sentById?: string,
    sentByName?: string,
    isDemo?: boolean,
    forceDelivery?: boolean
  ): Promise<SendDriverSmsResult> {
    if (forceDelivery) {
      const driver = await prisma.park_driver.findUnique({
        where: { id: driverId },
      });
      
      if (!driver || driver.tenantId !== this.tenantId) {
        return { success: false, error: 'Driver not found or access denied' };
      }
      
      if (!driver.phone) {
        return { success: false, error: 'Driver has no phone number' };
      }

      const smsLog = await prisma.park_driver_sms_log.create({
        data: {
          tenantId: this.tenantId,
          driverId,
          tripId: tripId || null,
          messageType: 'CUSTOM',
          phoneNumber: driver.phone,
          messageContent: message,
          status: 'PENDING',
          sentById: sentById || null,
          sentByName: sentByName || null,
          isDemo: isDemo ?? false,
        },
      });

      const sendResult = await this.deliverSms(driver.phone, message, isDemo ?? false);

      await prisma.park_driver_sms_log.update({
        where: { id: smsLog.id },
        data: {
          status: sendResult.success ? 'SENT' : 'FAILED',
          externalId: sendResult.externalId || null,
          errorMessage: sendResult.error || null,
          sentAt: sendResult.success ? new Date() : null,
        },
      });

      return {
        success: sendResult.success,
        smsLogId: smsLog.id,
        externalId: sendResult.externalId,
        error: sendResult.error,
        message,
      };
    }
    
    return this.sendDriverSms({
      tenantId: this.tenantId,
      driverId,
      tripId,
      messageType: 'CUSTOM',
      customMessage: message,
      sentById,
      sentByName,
      isDemo,
    });
  }

  /**
   * Get SMS history for a driver
   * Enforces tenant isolation - only returns data if driver belongs to this tenant
   */
  async getDriverSmsHistory(
    driverId: string,
    limit: number = 20
  ): Promise<DriverSmsHistory | null> {
    const driver = await prisma.park_driver.findFirst({
      where: { 
        id: driverId,
        tenantId: this.tenantId,
      },
      select: { id: true, fullName: true, phone: true, tenantId: true },
    });

    if (!driver || driver.tenantId !== this.tenantId) return null;

    const [messages, totalCount] = await Promise.all([
      prisma.park_driver_sms_log.findMany({
        where: {
          tenantId: this.tenantId,
          driverId,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.park_driver_sms_log.count({
        where: {
          tenantId: this.tenantId,
          driverId,
        },
      }),
    ]);

    return {
      driver: {
        id: driver.id,
        fullName: driver.fullName,
        phone: driver.phone,
      },
      messages: messages.map((m: SmsLog) => ({
        id: m.id,
        driverId: m.driverId,
        tripId: m.tripId,
        messageType: m.messageType as DriverSmsType,
        phoneNumber: m.phoneNumber,
        messageContent: m.messageContent,
        status: m.status as 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED',
        externalId: m.externalId,
        errorMessage: m.errorMessage,
        sentAt: m.sentAt,
        createdAt: m.createdAt,
      })),
      totalCount,
    };
  }

  /**
   * Get recent SMS logs for a trip
   * Enforces tenant isolation - only returns data if trip belongs to this tenant
   */
  async getTripSmsLogs(tripId: string): Promise<SmsLogEntry[]> {
    const trip = await prisma.park_trip.findFirst({
      where: {
        id: tripId,
        tenantId: this.tenantId,
      },
      select: { id: true },
    });

    if (!trip) return [];

    const logs = await prisma.park_driver_sms_log.findMany({
      where: {
        tenantId: this.tenantId,
        tripId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs.map((m: SmsLog) => ({
      id: m.id,
      driverId: m.driverId,
      tripId: m.tripId,
      messageType: m.messageType as DriverSmsType,
      phoneNumber: m.phoneNumber,
      messageContent: m.messageContent,
      status: m.status as 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED',
      externalId: m.externalId,
      errorMessage: m.errorMessage,
      sentAt: m.sentAt,
      createdAt: m.createdAt,
    }));
  }

  /**
   * Deliver SMS via provider (Twilio or demo mode)
   * Private method - actual SMS delivery
   */
  private async deliverSms(
    phoneNumber: string,
    message: string,
    isDemo: boolean
  ): Promise<{ success: boolean; externalId?: string; error?: string }> {
    if (isDemo) {
      console.log(`[DEMO SMS] To: ${phoneNumber}\nMessage: ${message}`);
      return {
        success: true,
        externalId: `demo_${Date.now()}`,
      };
    }

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioSid || !twilioToken || !twilioPhone) {
      console.warn(`[SMS - No Twilio configured] Would send to: ${phoneNumber}`);
      console.warn(`Message: ${message}`);
      return {
        success: false,
        error: 'SMS not configured: Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) are required for production SMS. Use isDemo=true for testing.',
      };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');

      const formattedPhone = formatNigerianPhone(phoneNumber);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: twilioPhone,
          Body: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        externalId: data.sid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS delivery failed',
      };
    }
  }
}

function formatNigerianPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('234') && cleaned.length === 10) {
    cleaned = '234' + cleaned;
  }
  
  return '+' + cleaned;
}

export function createDriverSmsService(tenantId: string): DriverSmsService {
  return new DriverSmsService(tenantId);
}
