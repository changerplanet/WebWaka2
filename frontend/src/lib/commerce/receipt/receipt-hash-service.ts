import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

interface ReceiptHashData {
  receiptNumber: string;
  tenantId: string;
  sourceType: string;
  sourceId: string;
  grandTotal: string;
  currency: string;
  transactionDate: string;
  paymentMethod: string;
  paymentReference: string | null;
  businessName: string;
}

function normalizeDecimal(value: any): string {
  if (value === null || value === undefined) return '0.00';
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
}

export function generateReceiptHash(data: ReceiptHashData): string {
  const payload = [
    data.receiptNumber,
    data.tenantId,
    data.sourceType,
    data.sourceId,
    normalizeDecimal(data.grandTotal),
    data.currency,
    data.transactionDate,
    data.paymentMethod,
    data.paymentReference || '',
    data.businessName,
  ].join(':');

  return createHash('sha256').update(payload).digest('hex');
}

export async function computeAndStoreReceiptHash(receiptId: string): Promise<string | null> {
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
  });

  if (!receipt) return null;

  const hash = generateReceiptHash({
    receiptNumber: receipt.receiptNumber,
    tenantId: receipt.tenantId,
    sourceType: receipt.sourceType,
    sourceId: receipt.sourceId,
    grandTotal: normalizeDecimal(receipt.grandTotal),
    currency: receipt.currency,
    transactionDate: receipt.transactionDate.toISOString(),
    paymentMethod: receipt.paymentMethod,
    paymentReference: receipt.paymentReference,
    businessName: receipt.businessName,
  });

  await prisma.$executeRaw`
    UPDATE receipt SET "verificationHash" = ${hash} WHERE id = ${receiptId}
  `;

  return hash;
}

export async function verifyReceiptHash(receiptId: string): Promise<{ valid: boolean; tampered: boolean; storedHash: string | null; computedHash: string | null }> {
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
  });

  if (!receipt) {
    return { valid: false, tampered: false, storedHash: null, computedHash: null };
  }

  const receiptExt = receipt as typeof receipt & { verificationHash?: string | null };

  const computedHash = generateReceiptHash({
    receiptNumber: receipt.receiptNumber,
    tenantId: receipt.tenantId,
    sourceType: receipt.sourceType,
    sourceId: receipt.sourceId,
    grandTotal: normalizeDecimal(receipt.grandTotal),
    currency: receipt.currency,
    transactionDate: receipt.transactionDate.toISOString(),
    paymentMethod: receipt.paymentMethod,
    paymentReference: receipt.paymentReference,
    businessName: receipt.businessName,
  });

  const storedHash = receiptExt.verificationHash || null;
  
  if (!storedHash) {
    return { valid: true, tampered: false, storedHash: null, computedHash, unsigned: true };
  }

  const matches = storedHash === computedHash;
  return {
    valid: matches,
    tampered: !matches,
    storedHash,
    computedHash,
    unsigned: false,
  };
}

export type ReceiptHashResult = {
  valid: boolean;
  tampered: boolean;
  storedHash: string | null;
  computedHash: string | null;
  unsigned?: boolean;
};
