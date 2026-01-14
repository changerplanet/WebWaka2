/**
 * HEALTH PORTAL SERVICE
 * 
 * Server-side service for Health Portal data access.
 * Provides read-only access to patient data.
 * 
 * Part of Phase E2.2 - Education & Health Portals
 * Created: January 14, 2026
 */

import { prisma } from '@/lib/prisma';

export interface PatientProfile {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  fullName: string;
  dateOfBirth: Date | null;
  gender: string | null;
  bloodGroup: string;
  genotype: string;
  phone: string | null;
  email: string | null;
  status: string;
  allergies: string[];
  conditions: string[];
}

export interface AppointmentRecord {
  id: string;
  appointmentDate: Date;
  appointmentTime: string | null;
  type: string;
  status: string;
  provider: string | null;
  facility: string | null;
  reason: string | null;
  duration: number;
}

export interface PrescriptionRecord {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number | null;
  route: string | null;
  instructions: string | null;
  prescribedAt: Date;
  prescriberName: string;
  status: string;
  expiresAt: Date | null;
}

export interface VisitSummary {
  id: string;
  visitNumber: string;
  visitDate: Date;
  chiefComplaint: string | null;
  provider: string | null;
  facility: string | null;
  status: string;
  diagnoses: Array<{
    code: string | null;
    description: string;
    type: string;
  }>;
}

export interface BillingSummary {
  totalBilled: number;
  currency: string;
  recentBills: Array<{
    id: string;
    serviceDate: Date;
    description: string;
    amount: number;
    status: string;
  }>;
}

export class HealthPortalService {
  async getPatientProfile(tenantId: string, patientId: string): Promise<PatientProfile | null> {
    const patient = await prisma.health_patient.findFirst({
      where: { tenantId, id: patientId },
    });

    if (!patient) return null;

    const allergies: string[] = Array.isArray(patient.allergies) 
      ? (patient.allergies as string[]) 
      : [];
    const conditions: string[] = Array.isArray(patient.conditions) 
      ? (patient.conditions as string[]) 
      : [];

    return {
      id: patient.id,
      mrn: patient.mrn,
      firstName: patient.firstName,
      lastName: patient.lastName,
      middleName: patient.middleName,
      fullName: `${patient.firstName} ${patient.middleName ? patient.middleName + ' ' : ''}${patient.lastName}`,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      genotype: patient.genotype,
      phone: patient.phone,
      email: patient.email,
      status: patient.status,
      allergies,
      conditions,
    };
  }

  async getAppointments(
    tenantId: string, 
    patientId: string, 
    includeUpcoming: boolean = true
  ): Promise<AppointmentRecord[]> {
    const now = new Date();
    
    const whereClause: any = { tenantId, patientId };
    
    if (!includeUpcoming) {
      whereClause.appointmentDate = { lt: now };
    }

    const appointments = await prisma.health_appointment.findMany({
      where: whereClause,
      include: {
        provider: true,
        facility: true,
      },
      orderBy: { appointmentDate: 'desc' },
      take: 50,
    });

    return appointments.map(apt => ({
      id: apt.id,
      appointmentDate: apt.appointmentDate,
      appointmentTime: apt.appointmentTime,
      type: apt.type,
      status: apt.status,
      provider: apt.provider 
        ? `Dr. ${apt.provider.firstName} ${apt.provider.lastName}`
        : null,
      facility: apt.facility?.name || null,
      reason: apt.reason,
      duration: apt.duration,
    }));
  }

  async getPrescriptions(
    tenantId: string, 
    patientId: string
  ): Promise<PrescriptionRecord[]> {
    const prescriptions = await prisma.health_prescription.findMany({
      where: { tenantId, patientId },
      include: {
        prescriber: true,
      },
      orderBy: { prescribedAt: 'desc' },
      take: 50,
    });

    return prescriptions.map(rx => ({
      id: rx.id,
      medication: rx.medication,
      dosage: rx.dosage,
      frequency: rx.frequency,
      duration: rx.duration,
      quantity: rx.quantity,
      route: rx.route,
      instructions: rx.instructions,
      prescribedAt: rx.prescribedAt,
      prescriberName: `Dr. ${rx.prescriber.firstName} ${rx.prescriber.lastName}`,
      status: rx.status,
      expiresAt: rx.expiresAt,
    }));
  }

  async getVisitSummaries(
    tenantId: string, 
    patientId: string
  ): Promise<VisitSummary[]> {
    const visits = await prisma.health_visit.findMany({
      where: { tenantId, patientId },
      include: {
        provider: true,
        facility: true,
        encounters: {
          include: {
            diagnoses: true,
          },
        },
      },
      orderBy: { visitDate: 'desc' },
      take: 30,
    });

    return visits.map(visit => {
      const allDiagnoses = visit.encounters.flatMap(enc => 
        enc.diagnoses.map(dx => ({
          code: dx.icdCode,
          description: dx.description,
          type: dx.type,
        }))
      );

      return {
        id: visit.id,
        visitNumber: visit.visitNumber,
        visitDate: visit.visitDate,
        chiefComplaint: visit.chiefComplaint,
        provider: visit.provider 
          ? `Dr. ${visit.provider.firstName} ${visit.provider.lastName}`
          : null,
        facility: visit.facility?.name || null,
        status: visit.status,
        diagnoses: allDiagnoses,
      };
    });
  }

  async getBillingSummary(tenantId: string, patientId: string): Promise<BillingSummary> {
    const billingFacts = await prisma.health_billing_fact.findMany({
      where: { tenantId, patientId },
      include: {
        visit: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    let totalBilled = 0;

    const recentBills = billingFacts.map(bf => {
      const amount = Number(bf.amount) * bf.quantity;
      totalBilled += amount;

      return {
        id: bf.id,
        serviceDate: bf.serviceDate,
        description: bf.description,
        amount,
        status: bf.status,
      };
    });

    return {
      totalBilled,
      currency: 'NGN',
      recentBills,
    };
  }
}

export const healthPortalService = new HealthPortalService();
