/**
 * ParkHub Driver SMS Templates
 * Wave F7: SMS Driver Updates
 * 
 * Nigeria-appropriate SMS templates for driver notifications.
 * Multi-language support: English (en), Yoruba (yo), Igbo (ig), Hausa (ha)
 * 
 * SMS character limits: 160 chars for single SMS, keep messages concise.
 */

import { DriverSmsType, SmsLanguage, TripInfo, DriverInfo } from './types';

interface TemplateContext {
  driver: DriverInfo;
  trip?: TripInfo;
  customMessage?: string;
  parkName?: string;
}

type TemplateFunction = (ctx: TemplateContext) => string;

const templates: Record<DriverSmsType, Record<SmsLanguage, TemplateFunction>> = {
  TRIP_ASSIGNMENT: {
    en: (ctx) => {
      const trip = ctx.trip!;
      const time = trip.scheduledDeparture 
        ? formatTime(trip.scheduledDeparture)
        : 'WHEN FULL';
      return `${ctx.driver.fullName}, you've been assigned trip ${trip.tripNumber}. Route: ${trip.routeName}. Departure: ${time}. Vehicle: ${trip.vehiclePlateNumber || 'TBA'}. Report to park.`;
    },
    yo: (ctx) => {
      const trip = ctx.trip!;
      const time = trip.scheduledDeparture 
        ? formatTime(trip.scheduledDeparture)
        : 'NIGBATI O BA KUN';
      return `${ctx.driver.fullName}, o ti gba irin-ajo ${trip.tripNumber}. Ona: ${trip.routeName}. Akoko ilọ: ${time}. Ọkọ: ${trip.vehiclePlateNumber || 'A nṣiṣẹ'}. Pada si ibudo.`;
    },
    ig: (ctx) => {
      const trip = ctx.trip!;
      const time = trip.scheduledDeparture 
        ? formatTime(trip.scheduledDeparture)
        : 'MGBE O JURU';
      return `${ctx.driver.fullName}, e kenyere gi njem ${trip.tripNumber}. Uzọ: ${trip.routeName}. Oge ịpụ: ${time}. Ụgbọ: ${trip.vehiclePlateNumber || 'TBA'}. Laghachi n'ọdụ.`;
    },
    ha: (ctx) => {
      const trip = ctx.trip!;
      const time = trip.scheduledDeparture 
        ? formatTime(trip.scheduledDeparture)
        : 'IDAN YA CIKA';
      return `${ctx.driver.fullName}, an ba ka tafiya ${trip.tripNumber}. Hanya: ${trip.routeName}. Lokacin tashi: ${time}. Mota: ${trip.vehiclePlateNumber || 'TBA'}. Koma tashar.`;
    },
  },

  READY_TO_DEPART: {
    en: (ctx) => {
      const trip = ctx.trip!;
      return `${ctx.driver.fullName}, trip ${trip.tripNumber} is READY TO GO! ${trip.bookedSeats}/${trip.totalSeats} passengers. Route: ${trip.routeName}. Proceed to departure point now.`;
    },
    yo: (ctx) => {
      const trip = ctx.trip!;
      return `${ctx.driver.fullName}, irin-ajo ${trip.tripNumber} TI SETAN! Ero: ${trip.bookedSeats}/${trip.totalSeats}. Ona: ${trip.routeName}. Lo si ibi ilọ bayi.`;
    },
    ig: (ctx) => {
      const trip = ctx.trip!;
      return `${ctx.driver.fullName}, njem ${trip.tripNumber} DỊ NJIKERE! Ndị njem: ${trip.bookedSeats}/${trip.totalSeats}. Uzọ: ${trip.routeName}. Gaa ebe ịpụ ugbu a.`;
    },
    ha: (ctx) => {
      const trip = ctx.trip!;
      return `${ctx.driver.fullName}, tafiya ${trip.tripNumber} ta SHIRYA! Fasinjoji: ${trip.bookedSeats}/${trip.totalSeats}. Hanya: ${trip.routeName}. Je wurin tashi yanzu.`;
    },
  },

  DEPARTURE_REMINDER: {
    en: (ctx) => {
      const trip = ctx.trip!;
      const time = trip.scheduledDeparture 
        ? formatTime(trip.scheduledDeparture)
        : 'soon';
      return `REMINDER: ${ctx.driver.fullName}, trip ${trip.tripNumber} departs at ${time}. ${trip.bookedSeats} passengers booked. Be ready at departure point.`;
    },
    yo: (ctx) => {
      const trip = ctx.trip!;
      const time = trip.scheduledDeparture 
        ? formatTime(trip.scheduledDeparture)
        : 'laipe';
      return `IRANTI: ${ctx.driver.fullName}, irin-ajo ${trip.tripNumber} yoo lọ ni ${time}. Ero ${trip.bookedSeats}. Wa ni ibi ilọ.`;
    },
    ig: (ctx) => {
      const trip = ctx.trip!;
      const time = trip.scheduledDeparture 
        ? formatTime(trip.scheduledDeparture)
        : 'oge na-abịa';
      return `NCHETARA: ${ctx.driver.fullName}, njem ${trip.tripNumber} na-apụ na ${time}. Ndị njem ${trip.bookedSeats}. Nọrọ njikere n'ebe ịpụ.`;
    },
    ha: (ctx) => {
      const trip = ctx.trip!;
      const time = trip.scheduledDeparture 
        ? formatTime(trip.scheduledDeparture)
        : 'nan gaba';
      return `TUNATARWA: ${ctx.driver.fullName}, tafiya ${trip.tripNumber} za ta tashi ${time}. Fasinjoji ${trip.bookedSeats}. Ka shirya a wurin tashi.`;
    },
  },

  STATUS_CHANGE: {
    en: (ctx) => {
      const trip = ctx.trip!;
      return `${ctx.driver.fullName}, trip ${trip.tripNumber} status changed to: ${formatStatus(trip.status)}. Route: ${trip.routeName}.`;
    },
    yo: (ctx) => {
      const trip = ctx.trip!;
      return `${ctx.driver.fullName}, ipo irin-ajo ${trip.tripNumber} ti yipada si: ${formatStatus(trip.status)}. Ona: ${trip.routeName}.`;
    },
    ig: (ctx) => {
      const trip = ctx.trip!;
      return `${ctx.driver.fullName}, ọnọdụ njem ${trip.tripNumber} gbanwere ka: ${formatStatus(trip.status)}. Uzọ: ${trip.routeName}.`;
    },
    ha: (ctx) => {
      const trip = ctx.trip!;
      return `${ctx.driver.fullName}, yanayin tafiya ${trip.tripNumber} ya canja zuwa: ${formatStatus(trip.status)}. Hanya: ${trip.routeName}.`;
    },
  },

  CANCELLATION: {
    en: (ctx) => {
      const trip = ctx.trip!;
      return `${ctx.driver.fullName}, trip ${trip.tripNumber} (${trip.routeName}) has been CANCELLED. Contact park office for reassignment.`;
    },
    yo: (ctx) => {
      const trip = ctx.trip!;
      return `${ctx.driver.fullName}, irin-ajo ${trip.tripNumber} (${trip.routeName}) ti FAGILEE. Pe ọfiisi ibudo fun iṣẹ miran.`;
    },
    ig: (ctx) => {
      const trip = ctx.trip!;
      return `${ctx.driver.fullName}, njem ${trip.tripNumber} (${trip.routeName}) AKAGBURU. Kpọọ ụlọ ọrụ n'ọdụ maka ịtinye ọzọ.`;
    },
    ha: (ctx) => {
      const trip = ctx.trip!;
      return `${ctx.driver.fullName}, tafiya ${trip.tripNumber} (${trip.routeName}) an SOKE. Tuntuɓi ofishin tashar don sake sanya.`;
    },
  },

  CUSTOM: {
    en: (ctx) => ctx.customMessage || 'No message provided.',
    yo: (ctx) => ctx.customMessage || 'Ko si ifiranṣẹ.',
    ig: (ctx) => ctx.customMessage || 'Enweghị ozi.',
    ha: (ctx) => ctx.customMessage || 'Babu saƙo.',
  },
};

function formatTime(date: Date): string {
  const d = new Date(date);
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes}${ampm}`;
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    SCHEDULED: 'Scheduled',
    BOARDING: 'Boarding',
    READY_TO_DEPART: 'Ready to Depart',
    DEPARTED: 'Departed',
    IN_TRANSIT: 'In Transit',
    ARRIVED: 'Arrived',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return statusMap[status] || status;
}

export function generateDriverSms(
  messageType: DriverSmsType,
  context: TemplateContext
): string {
  const language = context.driver.smsLanguage || 'en';
  const template = templates[messageType]?.[language] || templates[messageType]?.en;
  
  if (!template) {
    return `Message type "${messageType}" not supported.`;
  }

  const message = template(context);
  
  if (message.length > 160) {
    return message.substring(0, 157) + '...';
  }
  
  return message;
}

export function getSupportedLanguages(): Array<{ code: SmsLanguage; name: string }> {
  return [
    { code: 'en', name: 'English' },
    { code: 'yo', name: 'Yoruba' },
    { code: 'ig', name: 'Igbo' },
    { code: 'ha', name: 'Hausa' },
  ];
}
