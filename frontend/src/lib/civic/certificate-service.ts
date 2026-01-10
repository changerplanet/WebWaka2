/**
 * CIVIC SUITE: Certificate Service
 * 
 * In-memory service for managing certificate/document issuance.
 */

import {
  Certificate,
  CertificateType,
  CertificateStatus,
  CERTIFICATE_TYPES,
  generateCertificateNumber,
  generateVerificationCode,
} from './config';
import { getCertificatesStore, getConstituentsStore } from './demo-data';

// ============================================================================
// CERTIFICATE SERVICE
// ============================================================================

export async function getCertificates(tenantId: string, options?: {
  status?: CertificateStatus;
  type?: CertificateType;
  constituentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ certificates: Certificate[]; total: number; stats: CertificateStats }> {
  const store = getCertificatesStore();
  let filtered = store.filter((c: any) => c.tenantId === tenantId || tenantId === 'demo-civic');
  
  if (options?.status) {
    filtered = filtered.filter((c: any) => c.status === options.status);
  }
  
  if (options?.type) {
    filtered = filtered.filter((c: any) => c.certificateType === options.type);
  }
  
  if (options?.constituentId) {
    filtered = filtered.filter((c: any) => c.constituentId === options.constituentId);
  }
  
  if (options?.search) {
    const search = options.search.toLowerCase();
    filtered = filtered.filter((c: any) => 
      c.certificateNumber.toLowerCase().includes(search) ||
      c.constituentName.toLowerCase().includes(search) ||
      c.verificationCode.toLowerCase().includes(search)
    );
  }
  
  // Sort by created date (newest first)
  filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const total = filtered.length;
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  
  return {
    certificates: paginated,
    total,
    stats: calculateStats(store.filter((c: any) => c.tenantId === tenantId || tenantId === 'demo-civic')),
  };
}

export async function getCertificateById(tenantId: string, id: string): Promise<Certificate | null> {
  const store = getCertificatesStore();
  return store.find((c: any) => c.id === id && (c.tenantId === tenantId || tenantId === 'demo-civic')) || null;
}

export async function getCertificateByVerificationCode(code: string): Promise<Certificate | null> {
  const store = getCertificatesStore();
  return store.find((c: any) => c.verificationCode === code) || null;
}

export async function requestCertificate(tenantId: string, data: {
  constituentId: string;
  certificateType: CertificateType;
  purpose?: string;
}): Promise<Certificate> {
  const store = getCertificatesStore();
  const constituents = getConstituentsStore();
  const constituent = constituents.find((c: any) => c.id === data.constituentId);
  
  if (!constituent) {
    throw new Error('Constituent not found');
  }
  
  const certType = CERTIFICATE_TYPES[data.certificateType];
  
  const newCertificate: Certificate = {
    id: `cert_${Date.now()}`,
    tenantId,
    certificateNumber: generateCertificateNumber(data.certificateType),
    constituentId: data.constituentId,
    constituentName: `${constituent.firstName} ${constituent.lastName}`,
    certificateType: data.certificateType,
    purpose: data.purpose,
    status: 'PENDING',
    verificationCode: generateVerificationCode(),
    feePaid: certType.fee,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  store.push(newCertificate);
  return newCertificate;
}

export async function approveCertificate(
  tenantId: string,
  id: string
): Promise<Certificate | null> {
  const store = getCertificatesStore();
  const index = store.findIndex((c: any) => c.id === id && (c.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    status: 'APPROVED',
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function issueCertificate(
  tenantId: string,
  id: string,
  issuedBy: string
): Promise<Certificate | null> {
  const store = getCertificatesStore();
  const index = store.findIndex((c: any) => c.id === id && (c.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  const cert = store[index];
  const certType = CERTIFICATE_TYPES[cert.certificateType];
  const issuedDate = new Date().toISOString().split('T')[0];
  
  let validUntil: string | undefined;
  if (certType.validityDays) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + certType.validityDays);
    validUntil = expiryDate.toISOString().split('T')[0];
  }
  
  store[index] = {
    ...cert,
    status: 'ISSUED',
    issuedDate,
    validUntil,
    issuedBy,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function rejectCertificate(
  tenantId: string,
  id: string,
  reason: string
): Promise<Certificate | null> {
  const store = getCertificatesStore();
  const index = store.findIndex((c: any) => c.id === id && (c.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    status: 'REJECTED',
    notes: reason,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function revokeCertificate(
  tenantId: string,
  id: string,
  reason: string
): Promise<Certificate | null> {
  const store = getCertificatesStore();
  const index = store.findIndex((c: any) => c.id === id && (c.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    status: 'REVOKED',
    notes: reason,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

// ============================================================================
// VERIFICATION
// ============================================================================

export async function verifyCertificate(verificationCode: string): Promise<{
  valid: boolean;
  certificate?: Certificate;
  message: string;
}> {
  const certificate = await getCertificateByVerificationCode(verificationCode);
  
  if (!certificate) {
    return {
      valid: false,
      message: 'Certificate not found. The verification code may be invalid.',
    };
  }
  
  if (certificate.status === 'REVOKED') {
    return {
      valid: false,
      certificate,
      message: 'This certificate has been revoked.',
    };
  }
  
  if (certificate.status === 'EXPIRED') {
    return {
      valid: false,
      certificate,
      message: 'This certificate has expired.',
    };
  }
  
  if (certificate.status !== 'ISSUED') {
    return {
      valid: false,
      certificate,
      message: `This certificate is in ${certificate.status} status and not yet valid.`,
    };
  }
  
  if (certificate.validUntil && new Date(certificate.validUntil) < new Date()) {
    return {
      valid: false,
      certificate,
      message: 'This certificate has expired.',
    };
  }
  
  return {
    valid: true,
    certificate,
    message: 'Certificate is valid and authentic.',
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

interface CertificateStats {
  total: number;
  pending: number;
  issued: number;
  rejected: number;
  expired: number;
  totalRevenue: number;
  byType: Record<string, number>;
}

function calculateStats(certificates: Certificate[]): CertificateStats {
  const now = new Date();
  
  return {
    total: certificates.length,
    pending: certificates.filter((c: any) => c.status === 'PENDING' || c.status === 'APPROVED').length,
    issued: certificates.filter((c: any) => c.status === 'ISSUED').length,
    rejected: certificates.filter((c: any) => c.status === 'REJECTED').length,
    expired: certificates.filter((c: any) => 
      c.status === 'EXPIRED' || 
      (c.validUntil && new Date(c.validUntil) < now)
    ).length,
    totalRevenue: certificates
      .filter((c: any) => c.status === 'ISSUED')
      .reduce((sum: any, c: any) => sum + c.feePaid, 0),
    byType: certificates.reduce((acc: any, c: any) => {
      acc[c.certificateType] = (acc[c.certificateType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

export async function getCertificateStats(tenantId: string): Promise<CertificateStats> {
  const store = getCertificatesStore();
  const filtered = store.filter((c: any) => c.tenantId === tenantId || tenantId === 'demo-civic');
  return calculateStats(filtered);
}
