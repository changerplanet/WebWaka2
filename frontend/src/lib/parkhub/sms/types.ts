/**
 * ParkHub Driver SMS Types
 * Wave F7: SMS Driver Updates
 * 
 * Type definitions for SMS notifications to ParkHub drivers.
 * Feature-phone compatible (SMS only, no apps needed).
 */

export type DriverSmsType = 
  | 'TRIP_ASSIGNMENT'
  | 'READY_TO_DEPART'
  | 'DEPARTURE_REMINDER'
  | 'STATUS_CHANGE'
  | 'CANCELLATION'
  | 'CUSTOM';

export type DriverSmsStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

export type SmsLanguage = 'en' | 'yo' | 'ig' | 'ha';

export interface DriverInfo {
  id: string;
  fullName: string;
  phone: string;
  prefersSmsNotifications: boolean;
  smsLanguage: SmsLanguage;
}

export interface TripInfo {
  id: string;
  tripNumber: string;
  routeName: string;
  origin: string;
  destination: string;
  scheduledDeparture?: Date | null;
  departureMode: 'SCHEDULED' | 'WHEN_FULL' | 'HYBRID';
  totalSeats: number;
  bookedSeats: number;
  status: string;
  vehiclePlateNumber?: string;
}

export interface SendDriverSmsInput {
  tenantId: string;
  driverId: string;
  tripId?: string;
  messageType: DriverSmsType;
  customMessage?: string;
  sentById?: string;
  sentByName?: string;
  isDemo?: boolean;
}

export interface SendDriverSmsResult {
  success: boolean;
  smsLogId?: string;
  externalId?: string;
  error?: string;
  message?: string;
}

export interface SmsLogEntry {
  id: string;
  driverId: string;
  tripId: string | null;
  messageType: DriverSmsType;
  phoneNumber: string;
  messageContent: string;
  status: DriverSmsStatus;
  externalId: string | null;
  errorMessage: string | null;
  sentAt: Date | null;
  createdAt: Date;
}

export interface DriverSmsHistory {
  driver: {
    id: string;
    fullName: string;
    phone: string;
  };
  messages: SmsLogEntry[];
  totalCount: number;
}
