/**
 * HEALTH SUITE: Prescription Service
 * 
 * Manages prescriptions and pharmacy dispensing.
 * SIMPLIFIED IMPLEMENTATION: In-memory demo storage.
 */

import {
  Prescription,
  PrescriptionItem,
  PrescriptionStatus,
  PRESCRIPTION_STATUS,
  generatePrescriptionId,
} from './config';

// ============================================================================
// IN-MEMORY STORAGE (Demo)
// ============================================================================

const prescriptionStorage: Map<string, Prescription[]> = new Map();

// ============================================================================
// PRESCRIPTION MANAGEMENT
// ============================================================================

export async function createPrescription(
  tenantId: string,
  input: {
    consultationId: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    items: PrescriptionItem[];
    validDays?: number;
    notes?: string;
  }
): Promise<{ success: boolean; prescriptionId?: string; error?: string }> {
  const prescriptions = prescriptionStorage.get(tenantId) || [];
  
  if (!input.items || input.items.length === 0) {
    return { success: false, error: 'Prescription must have at least one item' };
  }
  
  const prescriptionId = generatePrescriptionId();
  const validDays = input.validDays || 7;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);
  
  const newPrescription: Prescription = {
    id: prescriptionId,
    tenantId,
    consultationId: input.consultationId,
    patientId: input.patientId,
    patientName: input.patientName,
    doctorId: input.doctorId,
    doctorName: input.doctorName,
    status: 'CREATED',
    items: input.items.map(item => ({
      ...item,
      dispensed: false,
      dispensedQuantity: 0,
    })),
    validUntil: validUntil.toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    notes: input.notes,
  };
  
  prescriptions.push(newPrescription);
  prescriptionStorage.set(tenantId, prescriptions);
  
  console.log(`[Health Demo] Created prescription: ${prescriptionId}`);
  return { success: true, prescriptionId };
}

export async function getPrescription(
  tenantId: string,
  prescriptionId: string
): Promise<Prescription | null> {
  const prescriptions = prescriptionStorage.get(tenantId) || [];
  return prescriptions.find((p: any) => p.id === prescriptionId) || null;
}

export async function listPrescriptions(
  tenantId: string,
  filters?: {
    patientId?: string;
    doctorId?: string;
    status?: PrescriptionStatus;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<Prescription[]> {
  let prescriptions = prescriptionStorage.get(tenantId) || [];
  
  if (filters?.patientId) {
    prescriptions = prescriptions.filter((p: any) => p.patientId === filters.patientId);
  }
  
  if (filters?.doctorId) {
    prescriptions = prescriptions.filter((p: any) => p.doctorId === filters.doctorId);
  }
  
  if (filters?.status) {
    prescriptions = prescriptions.filter((p: any) => p.status === filters.status);
  }
  
  if (filters?.dateFrom) {
    prescriptions = prescriptions.filter((p: any) => p.createdAt >= filters.dateFrom!);
  }
  
  if (filters?.dateTo) {
    prescriptions = prescriptions.filter((p: any) => p.createdAt <= filters.dateTo!);
  }
  
  // Sort by date descending
  prescriptions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  
  return prescriptions;
}

export async function getPendingPrescriptions(
  tenantId: string
): Promise<Prescription[]> {
  return listPrescriptions(tenantId, { status: 'PENDING_DISPENSING' });
}

export async function updatePrescriptionStatus(
  tenantId: string,
  prescriptionId: string,
  status: PrescriptionStatus
): Promise<{ success: boolean; error?: string }> {
  const prescriptions = prescriptionStorage.get(tenantId) || [];
  const prescription = prescriptions.find((p: any) => p.id === prescriptionId);
  
  if (!prescription) {
    return { success: false, error: 'Prescription not found' };
  }
  
  prescription.status = status;
  prescriptionStorage.set(tenantId, prescriptions);
  return { success: true };
}

export async function dispensePrescription(
  tenantId: string,
  prescriptionId: string,
  dispensedBy: string,
  itemsDispensed?: { drugName: string; quantity: number }[]
): Promise<{ success: boolean; error?: string }> {
  const prescriptions = prescriptionStorage.get(tenantId) || [];
  const prescription = prescriptions.find((p: any) => p.id === prescriptionId);
  
  if (!prescription) {
    return { success: false, error: 'Prescription not found' };
  }
  
  // Check if prescription is expired
  if (new Date(prescription.validUntil) < new Date()) {
    prescription.status = 'EXPIRED';
    return { success: false, error: 'Prescription has expired' };
  }
  
  // If specific items provided, dispense those
  if (itemsDispensed) {
    for (const dispensed of itemsDispensed) {
      const item = prescription.items.find((i: any) => i.drugName === dispensed.drugName);
      if (item) {
        item.dispensedQuantity = (item.dispensedQuantity || 0) + dispensed.quantity;
        item.dispensed = item.dispensedQuantity >= item.quantity;
      }
    }
    
    // Check if all items are dispensed
    const allDispensed = prescription.items.every((i: any) => i.dispensed);
    const anyDispensed = prescription.items.some((i: any) => (i.dispensedQuantity || 0) > 0);
    
    prescription.status = allDispensed ? 'DISPENSED' : anyDispensed ? 'PARTIALLY_DISPENSED' : 'PENDING_DISPENSING';
  } else {
    // Dispense all items
    prescription.items.forEach(item => {
      item.dispensed = true;
      item.dispensedQuantity = item.quantity;
    });
    prescription.status = 'DISPENSED';
  }
  
  prescription.dispensedAt = new Date().toISOString();
  prescription.dispensedBy = dispensedBy;
  
  prescriptionStorage.set(tenantId, prescriptions);
  return { success: true };
}

export async function cancelPrescription(
  tenantId: string,
  prescriptionId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const prescriptions = prescriptionStorage.get(tenantId) || [];
  const prescription = prescriptions.find((p: any) => p.id === prescriptionId);
  
  if (!prescription) {
    return { success: false, error: 'Prescription not found' };
  }
  
  if (prescription.status === 'DISPENSED') {
    return { success: false, error: 'Cannot cancel dispensed prescription' };
  }
  
  prescription.status = 'CANCELLED';
  if (reason) {
    prescription.notes = `${prescription.notes || ''}\nCancelled: ${reason}`.trim();
  }
  
  prescriptionStorage.set(tenantId, prescriptions);
  return { success: true };
}

export async function getPatientPrescriptions(
  tenantId: string,
  patientId: string
): Promise<Prescription[]> {
  return listPrescriptions(tenantId, { patientId });
}

export async function getPrescriptionStats(
  tenantId: string,
  date?: string
): Promise<{
  total: number;
  created: number;
  pending: number;
  dispensed: number;
  cancelled: number;
}> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  let prescriptions = prescriptionStorage.get(tenantId) || [];
  
  if (date) {
    prescriptions = prescriptions.filter((p: any) => p.createdAt.startsWith(targetDate));
  }
  
  return {
    total: prescriptions.length,
    created: prescriptions.filter((p: any) => p.status === 'CREATED').length,
    pending: prescriptions.filter((p: any) => p.status === 'PENDING_DISPENSING' || p.status === 'PARTIALLY_DISPENSED').length,
    dispensed: prescriptions.filter((p: any) => p.status === 'DISPENSED').length,
    cancelled: prescriptions.filter((p: any) => p.status === 'CANCELLED').length,
  };
}

// ============================================================================
// COMMON MEDICATIONS (Demo Data)
// ============================================================================

export const COMMON_MEDICATIONS = [
  { name: 'Paracetamol 500mg', dosage: '1-2 tablets', frequency: 'Every 6 hours', defaultQuantity: 20 },
  { name: 'Ibuprofen 400mg', dosage: '1 tablet', frequency: 'Every 8 hours', defaultQuantity: 15 },
  { name: 'Amoxicillin 500mg', dosage: '1 capsule', frequency: '3 times daily', defaultQuantity: 21 },
  { name: 'Metformin 500mg', dosage: '1 tablet', frequency: 'Twice daily', defaultQuantity: 60 },
  { name: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'Once daily', defaultQuantity: 30 },
  { name: 'Omeprazole 20mg', dosage: '1 capsule', frequency: 'Once daily', defaultQuantity: 14 },
  { name: 'Metronidazole 400mg', dosage: '1 tablet', frequency: '3 times daily', defaultQuantity: 21 },
  { name: 'Ciprofloxacin 500mg', dosage: '1 tablet', frequency: 'Twice daily', defaultQuantity: 14 },
  { name: 'Vitamin C 1000mg', dosage: '1 tablet', frequency: 'Once daily', defaultQuantity: 30 },
  { name: 'Multivitamins', dosage: '1 tablet', frequency: 'Once daily', defaultQuantity: 30 },
];
