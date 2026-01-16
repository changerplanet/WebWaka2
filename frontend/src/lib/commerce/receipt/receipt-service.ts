import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type {
  Receipt,
  ReceiptItem,
  ReceiptDelivery,
  GeneratePosReceiptInput,
  GenerateParkHubReceiptInput,
  GenerateSvmReceiptInput,
  GenerateMvmReceiptInput,
  DeliverReceiptInput,
  ThermalPrintData,
  ReceiptVerification,
  ReceiptSyncStatus,
} from './types';

function generateReceiptNumber(prefix: string = 'RCP'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${year}${month}${day}-${random}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  }).format(date);
}

function buildVerificationUrl(receiptId: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || '';
  return `${base}/verify/receipt/${receiptId}`;
}

function mapDbReceiptToReceipt(dbReceipt: any, items: any[]): Receipt {
  return {
    id: dbReceipt.id,
    receiptNumber: dbReceipt.receiptNumber,
    receiptType: dbReceipt.receiptType,
    syncStatus: dbReceipt.syncStatus,
    offlineId: dbReceipt.offlineId || undefined,
    sourceType: dbReceipt.sourceType,
    sourceId: dbReceipt.sourceId,
    business: {
      businessName: dbReceipt.businessName,
      businessAddress: dbReceipt.businessAddress || undefined,
      businessPhone: dbReceipt.businessPhone || undefined,
      businessTaxId: dbReceipt.businessTaxId || undefined,
    },
    customer: dbReceipt.customerName || dbReceipt.customerPhone ? {
      customerName: dbReceipt.customerName || undefined,
      customerPhone: dbReceipt.customerPhone || undefined,
      customerEmail: dbReceipt.customerEmail || undefined,
    } : undefined,
    staff: {
      staffId: dbReceipt.staffId,
      staffName: dbReceipt.staffName,
    },
    parkHub: dbReceipt.routeId ? {
      routeId: dbReceipt.routeId || undefined,
      routeName: dbReceipt.routeName || undefined,
      tripId: dbReceipt.tripId || undefined,
      tripNumber: dbReceipt.tripNumber || undefined,
      seatNumbers: dbReceipt.seatNumbers || undefined,
      departureMode: dbReceipt.departureMode as any || undefined,
      manifestId: dbReceipt.manifestId || undefined,
    } : undefined,
    items: items.map(item => ({
      itemType: item.itemType as any,
      productId: item.productId || undefined,
      description: item.description,
      sku: item.sku || undefined,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount) || undefined,
      tax: Number(item.tax) || undefined,
      lineTotal: Number(item.lineTotal),
      seatNumber: item.seatNumber || undefined,
      passengerName: item.passengerName || undefined,
    })),
    subtotal: Number(dbReceipt.subtotal),
    discountTotal: Number(dbReceipt.discountTotal),
    taxTotal: Number(dbReceipt.taxTotal),
    roundingAmount: Number(dbReceipt.roundingAmount),
    roundingMode: dbReceipt.roundingMode || undefined,
    grandTotal: Number(dbReceipt.grandTotal),
    currency: dbReceipt.currency,
    payment: {
      paymentMethod: dbReceipt.paymentMethod as any,
      amountTendered: dbReceipt.amountTendered ? Number(dbReceipt.amountTendered) : undefined,
      changeGiven: dbReceipt.changeGiven ? Number(dbReceipt.changeGiven) : undefined,
      paymentReference: dbReceipt.paymentReference || undefined,
    },
    transactionDate: dbReceipt.transactionDate,
    isDemo: dbReceipt.isDemo,
    isVerified: dbReceipt.isVerified,
    verificationQrCode: dbReceipt.verificationQrCode || undefined,
    notes: dbReceipt.notes || undefined,
    createdAt: dbReceipt.createdAt,
  };
}

export function createReceiptService(tenantId: string) {
  async function generatePosReceipt(input: GeneratePosReceiptInput): Promise<Receipt> {
    const receiptNumber = generateReceiptNumber('POS');
    const isOffline = !!input.offlineId;
    const syncStatus: ReceiptSyncStatus = isOffline ? 'PENDING_SYNC' : 'SYNCED';
    
    const receipt = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newReceipt = await tx.receipt.create({
        data: {
          tenantId: input.tenantId,
          locationId: input.locationId,
          receiptNumber,
          receiptType: 'POS_SALE',
          syncStatus,
          offlineId: input.offlineId,
          syncedAt: isOffline ? undefined : new Date(),
          sourceType: 'POS_SALE',
          sourceId: input.saleId,
          businessName: input.business.businessName,
          businessAddress: input.business.businessAddress,
          businessPhone: input.business.businessPhone,
          businessTaxId: input.business.businessTaxId,
          transactionDate: input.transactionDate || new Date(),
          currency: 'NGN',
          subtotal: input.subtotal,
          discountTotal: input.discountTotal || 0,
          taxTotal: input.taxTotal || 0,
          roundingAmount: input.roundingAmount || 0,
          roundingMode: input.roundingMode,
          grandTotal: input.grandTotal,
          paymentMethod: input.payment.paymentMethod,
          amountTendered: input.payment.amountTendered,
          changeGiven: input.payment.changeGiven,
          paymentReference: input.payment.paymentReference,
          customerName: input.customer?.customerName,
          customerPhone: input.customer?.customerPhone,
          customerEmail: input.customer?.customerEmail,
          staffId: input.staff.staffId,
          staffName: input.staff.staffName,
          isDemo: input.isDemo || false,
          isVerified: !isOffline,
          notes: input.notes,
        },
      });
      
      await tx.receipt.update({
        where: { id: newReceipt.id },
        data: {
          verificationQrCode: buildVerificationUrl(newReceipt.id),
        },
      });
      
      if (input.items.length > 0) {
        await tx.receipt_item.createMany({
          data: input.items.map((item, index) => ({
            receiptId: newReceipt.id,
            itemType: item.itemType,
            productId: item.productId,
            description: item.description,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            tax: item.tax || 0,
            lineTotal: item.lineTotal,
            seatNumber: item.seatNumber,
            passengerName: item.passengerName,
            displayOrder: index,
          })),
        });
      }
      
      return newReceipt;
    });
    
    const items = await prisma.receipt_item.findMany({
      where: { receiptId: receipt.id },
      orderBy: { displayOrder: 'asc' },
    });
    
    const updatedReceipt = await prisma.receipt.findUnique({
      where: { id: receipt.id },
    });
    
    return mapDbReceiptToReceipt(updatedReceipt, items);
  }
  
  async function generateParkHubReceipt(input: GenerateParkHubReceiptInput): Promise<Receipt> {
    const receiptNumber = generateReceiptNumber('PHB');
    const isOffline = !!input.offlineId;
    const syncStatus: ReceiptSyncStatus = isOffline ? 'PENDING_SYNC' : 'SYNCED';
    
    const sourceType = input.queueId ? 'PARKHUB_QUEUE' : 'PARKHUB_TICKET';
    const sourceId = input.queueId || input.ticketId || '';
    
    const receipt = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newReceipt = await tx.receipt.create({
        data: {
          tenantId: input.tenantId,
          locationId: input.parkId,
          receiptNumber,
          receiptType: 'PARKHUB_TICKET',
          syncStatus,
          offlineId: input.offlineId,
          syncedAt: isOffline ? undefined : new Date(),
          sourceType,
          sourceId,
          businessName: input.business.businessName,
          businessAddress: input.business.businessAddress,
          businessPhone: input.business.businessPhone,
          businessTaxId: input.business.businessTaxId,
          transactionDate: input.transactionDate || new Date(),
          currency: 'NGN',
          subtotal: input.subtotal,
          discountTotal: input.discountTotal || 0,
          taxTotal: 0,
          roundingAmount: input.roundingAmount || 0,
          roundingMode: input.roundingMode,
          grandTotal: input.grandTotal,
          paymentMethod: input.payment.paymentMethod,
          amountTendered: input.payment.amountTendered,
          changeGiven: input.payment.changeGiven,
          paymentReference: input.payment.paymentReference,
          customerName: input.customer?.customerName,
          customerPhone: input.customer?.customerPhone,
          customerEmail: input.customer?.customerEmail,
          staffId: input.staff.staffId,
          staffName: input.staff.staffName,
          isDemo: input.isDemo || false,
          isVerified: !isOffline,
          routeId: input.parkHub.routeId,
          routeName: input.parkHub.routeName,
          tripId: input.parkHub.tripId,
          tripNumber: input.parkHub.tripNumber,
          seatNumbers: input.parkHub.seatNumbers || [],
          departureMode: input.parkHub.departureMode,
          manifestId: input.parkHub.manifestId,
          notes: input.notes,
        },
      });
      
      await tx.receipt.update({
        where: { id: newReceipt.id },
        data: {
          verificationQrCode: buildVerificationUrl(newReceipt.id),
        },
      });
      
      if (input.items.length > 0) {
        await tx.receipt_item.createMany({
          data: input.items.map((item, index) => ({
            receiptId: newReceipt.id,
            itemType: item.itemType,
            productId: item.productId,
            description: item.description,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            tax: item.tax || 0,
            lineTotal: item.lineTotal,
            seatNumber: item.seatNumber,
            passengerName: item.passengerName,
            displayOrder: index,
          })),
        });
      }
      
      return newReceipt;
    });
    
    const items = await prisma.receipt_item.findMany({
      where: { receiptId: receipt.id },
      orderBy: { displayOrder: 'asc' },
    });
    
    const updatedReceipt = await prisma.receipt.findUnique({
      where: { id: receipt.id },
    });
    
    return mapDbReceiptToReceipt(updatedReceipt, items);
  }
  
  /**
   * Wave C1: Generate receipt for SVM storefront order
   * Called on payment success (PAID/CAPTURED)
   */
  async function generateSvmReceipt(input: GenerateSvmReceiptInput): Promise<Receipt> {
    const receiptNumber = generateReceiptNumber('SVM');
    
    const receipt = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newReceipt = await tx.receipt.create({
        data: {
          tenantId: input.tenantId,
          receiptNumber,
          receiptType: 'SVM_ORDER',
          syncStatus: 'SYNCED',
          syncedAt: new Date(),
          sourceType: 'SVM_ORDER',
          sourceId: input.orderId,
          businessName: input.business.businessName,
          businessAddress: input.business.businessAddress,
          businessPhone: input.business.businessPhone,
          businessTaxId: input.business.businessTaxId,
          transactionDate: input.transactionDate || new Date(),
          currency: 'NGN',
          subtotal: input.subtotal,
          discountTotal: input.discountTotal || 0,
          taxTotal: input.taxTotal || 0,
          grandTotal: input.grandTotal,
          paymentMethod: input.payment.paymentMethod,
          paymentReference: input.payment.paymentReference,
          customerName: input.customer?.customerName,
          customerPhone: input.customer?.customerPhone,
          customerEmail: input.customer?.customerEmail,
          staffId: 'SYSTEM',
          staffName: 'Online Order',
          isDemo: input.isDemo || false,
          isVerified: true,
          notes: input.notes,
        },
      });
      
      await tx.receipt.update({
        where: { id: newReceipt.id },
        data: {
          verificationQrCode: buildVerificationUrl(newReceipt.id),
        },
      });
      
      if (input.items.length > 0) {
        await tx.receipt_item.createMany({
          data: input.items.map((item, index) => ({
            receiptId: newReceipt.id,
            itemType: item.itemType,
            productId: item.productId,
            description: item.description,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            tax: item.tax || 0,
            lineTotal: item.lineTotal,
            displayOrder: index,
          })),
        });
      }
      
      return newReceipt;
    });
    
    const items = await prisma.receipt_item.findMany({
      where: { receiptId: receipt.id },
      orderBy: { displayOrder: 'asc' },
    });
    
    const updatedReceipt = await prisma.receipt.findUnique({
      where: { id: receipt.id },
    });
    
    return mapDbReceiptToReceipt(updatedReceipt, items);
  }
  
  /**
   * Wave C1: Generate receipt for MVM marketplace parent order
   * Called on payment success (PAID/CAPTURED)
   */
  async function generateMvmReceipt(input: GenerateMvmReceiptInput): Promise<Receipt> {
    const receiptNumber = generateReceiptNumber('MVM');
    
    const receipt = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newReceipt = await tx.receipt.create({
        data: {
          tenantId: input.tenantId,
          receiptNumber,
          receiptType: 'MVM_ORDER',
          syncStatus: 'SYNCED',
          syncedAt: new Date(),
          sourceType: 'MVM_ORDER',
          sourceId: input.orderId,
          businessName: input.business.businessName,
          businessAddress: input.business.businessAddress,
          businessPhone: input.business.businessPhone,
          businessTaxId: input.business.businessTaxId,
          transactionDate: input.transactionDate || new Date(),
          currency: 'NGN',
          subtotal: input.subtotal,
          discountTotal: input.discountTotal || 0,
          taxTotal: input.taxTotal || 0,
          grandTotal: input.grandTotal,
          paymentMethod: input.payment.paymentMethod,
          paymentReference: input.payment.paymentReference,
          customerName: input.customer?.customerName,
          customerPhone: input.customer?.customerPhone,
          customerEmail: input.customer?.customerEmail,
          staffId: 'SYSTEM',
          staffName: 'Marketplace Order',
          isDemo: input.isDemo || false,
          isVerified: true,
          notes: input.notes,
        },
      });
      
      await tx.receipt.update({
        where: { id: newReceipt.id },
        data: {
          verificationQrCode: buildVerificationUrl(newReceipt.id),
        },
      });
      
      if (input.items.length > 0) {
        await tx.receipt_item.createMany({
          data: input.items.map((item, index) => ({
            receiptId: newReceipt.id,
            itemType: item.itemType,
            productId: item.productId,
            description: item.description,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            tax: item.tax || 0,
            lineTotal: item.lineTotal,
            displayOrder: index,
          })),
        });
      }
      
      return newReceipt;
    });
    
    const items = await prisma.receipt_item.findMany({
      where: { receiptId: receipt.id },
      orderBy: { displayOrder: 'asc' },
    });
    
    const updatedReceipt = await prisma.receipt.findUnique({
      where: { id: receipt.id },
    });
    
    return mapDbReceiptToReceipt(updatedReceipt, items);
  }
  
  async function getReceipt(receiptId: string): Promise<Receipt | null> {
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: receiptId,
        tenantId,
      },
      include: {
        items: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
    
    if (!receipt) return null;
    
    return mapDbReceiptToReceipt(receipt, receipt.items);
  }
  
  async function getReceiptByNumber(receiptNumber: string): Promise<Receipt | null> {
    const receipt = await prisma.receipt.findFirst({
      where: {
        receiptNumber,
        tenantId,
      },
      include: {
        items: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
    
    if (!receipt) return null;
    
    return mapDbReceiptToReceipt(receipt, receipt.items);
  }
  
  async function getReceiptsBySource(sourceType: string, sourceId: string): Promise<Receipt[]> {
    const receipts = await prisma.receipt.findMany({
      where: {
        tenantId,
        sourceType,
        sourceId,
      },
      include: {
        items: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return receipts.map(r => mapDbReceiptToReceipt(r, r.items));
  }
  
  async function listReceipts(filters?: {
    receiptType?: string;
    syncStatus?: string;
    locationId?: string;
    staffId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ receipts: Receipt[]; total: number }> {
    const where: any = { tenantId };
    
    if (filters?.receiptType) where.receiptType = filters.receiptType;
    if (filters?.syncStatus) where.syncStatus = filters.syncStatus;
    if (filters?.locationId) where.locationId = filters.locationId;
    if (filters?.staffId) where.staffId = filters.staffId;
    if (filters?.dateFrom || filters?.dateTo) {
      where.transactionDate = {};
      if (filters.dateFrom) where.transactionDate.gte = filters.dateFrom;
      if (filters.dateTo) where.transactionDate.lte = filters.dateTo;
    }
    
    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: {
          items: {
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit ?? 20,
        skip: filters?.offset ?? 0,
      }),
      prisma.receipt.count({ where }),
    ]);
    
    return {
      receipts: receipts.map(r => mapDbReceiptToReceipt(r, r.items)),
      total,
    };
  }
  
  async function syncReceipt(receiptId: string): Promise<Receipt> {
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: receiptId,
        tenantId,
      },
    });
    
    if (!receipt) {
      throw new Error('Receipt not found');
    }
    
    if (receipt.syncStatus === 'SYNCED') {
      throw new Error('Receipt is already synced');
    }
    
    const updated = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        syncStatus: 'SYNCED',
        syncedAt: new Date(),
        isVerified: true,
      },
      include: {
        items: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
    
    return mapDbReceiptToReceipt(updated, updated.items);
  }
  
  async function recordDelivery(input: DeliverReceiptInput): Promise<ReceiptDelivery> {
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: input.receiptId,
        tenantId,
      },
    });
    
    if (!receipt) {
      throw new Error('Receipt not found');
    }
    
    const delivery = await prisma.receipt_delivery.create({
      data: {
        receiptId: input.receiptId,
        channel: input.channel,
        status: 'SUCCESS',
        printerType: input.printerType,
        printerName: input.printerName,
        recipientPhone: input.recipientPhone,
        recipientEmail: input.recipientEmail,
        initiatedById: input.initiatedById,
        initiatedByName: input.initiatedByName,
      },
    });
    
    return {
      id: delivery.id,
      receiptId: delivery.receiptId,
      channel: delivery.channel as any,
      status: delivery.status as any,
      printerType: delivery.printerType || undefined,
      printerName: delivery.printerName || undefined,
      recipientPhone: delivery.recipientPhone || undefined,
      recipientEmail: delivery.recipientEmail || undefined,
      messageId: delivery.messageId || undefined,
      errorMessage: delivery.errorMessage || undefined,
      initiatedById: delivery.initiatedById || undefined,
      initiatedByName: delivery.initiatedByName || undefined,
      createdAt: delivery.createdAt,
    };
  }
  
  async function getDeliveryHistory(receiptId: string): Promise<ReceiptDelivery[]> {
    const deliveries = await prisma.receipt_delivery.findMany({
      where: { receiptId },
      orderBy: { createdAt: 'desc' },
    });
    
    return deliveries.map(d => ({
      id: d.id,
      receiptId: d.receiptId,
      channel: d.channel as any,
      status: d.status as any,
      printerType: d.printerType || undefined,
      printerName: d.printerName || undefined,
      recipientPhone: d.recipientPhone || undefined,
      recipientEmail: d.recipientEmail || undefined,
      messageId: d.messageId || undefined,
      errorMessage: d.errorMessage || undefined,
      initiatedById: d.initiatedById || undefined,
      initiatedByName: d.initiatedByName || undefined,
      createdAt: d.createdAt,
    }));
  }
  
  function formatForThermalPrint(receipt: Receipt): ThermalPrintData {
    return {
      receiptNumber: receipt.receiptNumber,
      businessName: receipt.business.businessName,
      businessAddress: receipt.business.businessAddress,
      businessPhone: receipt.business.businessPhone,
      transactionDate: formatDate(receipt.transactionDate),
      items: receipt.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      subtotal: receipt.subtotal,
      discountTotal: receipt.discountTotal || undefined,
      taxTotal: receipt.taxTotal || undefined,
      roundingAmount: receipt.roundingAmount || undefined,
      grandTotal: receipt.grandTotal,
      paymentMethod: receipt.payment.paymentMethod,
      amountTendered: receipt.payment.amountTendered,
      changeGiven: receipt.payment.changeGiven,
      staffName: receipt.staff.staffName,
      customerName: receipt.customer?.customerName,
      syncStatus: receipt.syncStatus,
      isDemo: receipt.isDemo,
      qrCodeUrl: receipt.verificationQrCode,
      parkHubInfo: receipt.parkHub ? {
        routeName: receipt.parkHub.routeName,
        tripNumber: receipt.parkHub.tripNumber,
        seatNumbers: receipt.parkHub.seatNumbers,
        departureMode: receipt.parkHub.departureMode,
      } : undefined,
    };
  }
  
  return {
    generatePosReceipt,
    generateParkHubReceipt,
    generateSvmReceipt,
    generateMvmReceipt,
    getReceipt,
    getReceiptByNumber,
    getReceiptsBySource,
    listReceipts,
    syncReceipt,
    recordDelivery,
    getDeliveryHistory,
    formatForThermalPrint,
    formatCurrency,
    formatDate,
  };
}

export async function verifyReceipt(receiptId: string): Promise<ReceiptVerification | null> {
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
  });
  
  if (!receipt) return null;
  
  return {
    receiptId: receipt.id,
    receiptNumber: receipt.receiptNumber,
    isValid: true,
    verifiedAt: new Date(),
    businessName: receipt.businessName,
    grandTotal: Number(receipt.grandTotal),
    transactionDate: receipt.transactionDate,
    syncStatus: receipt.syncStatus as ReceiptSyncStatus,
  };
}

import { verifyReceiptHash } from './receipt-hash-service';
import type { PublicVerificationResult } from './types';

export async function verifyReceiptPublic(receiptId: string): Promise<PublicVerificationResult | null> {
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
  });
  
  if (!receipt) return null;
  
  const receiptExt = receipt as typeof receipt & { isRevoked?: boolean };
  
  const hashResult = await verifyReceiptHash(receiptId);
  
  const verifiedAt = new Date().toISOString();
  const isRevoked = receiptExt.isRevoked || false;
  
  return {
    valid: !isRevoked && !hashResult.tampered,
    tampered: hashResult.tampered,
    revoked: isRevoked,
    sourceType: receipt.sourceType,
    verifiedAt,
    receiptNumber: receipt.receiptNumber,
    businessName: receipt.businessName,
    grandTotal: Number(receipt.grandTotal),
    currency: receipt.currency,
    transactionDate: receipt.transactionDate.toISOString(),
    isDemo: receipt.isDemo,
    syncStatus: receipt.syncStatus,
    unsigned: hashResult.unsigned,
  };
}
