/**
 * PROOF RESOLVERS
 * Wave J.3: Receipt & Proof Linking (Read-Only)
 * 
 * Read-only resolvers that traverse existing relationships between
 * orders, receipts, tickets, and manifests.
 * 
 * CONSTRAINTS:
 * - ❌ No mutations
 * - ❌ No schema changes
 * - ❌ No link creation
 * - ✅ Read-only Prisma queries
 * - ✅ Tenant isolation enforced
 * 
 * GAP: Receipt-to-order linkage relies on sourceType/sourceId fields.
 * Not all receipts have valid sourceId references.
 * 
 * @module lib/commerce/canonical-proof/resolvers
 */

import { prisma } from '../../prisma'
import { 
  CanonicalReceipt, 
  CanonicalTicket, 
  CanonicalManifest,
  CanonicalProof,
  ProofSourceSystem,
} from './types'

/**
 * Resolves a receipt to canonical format
 */
export async function resolveReceipt(
  tenantId: string,
  receiptNumber: string
): Promise<CanonicalReceipt | null> {
  const receipt = await prisma.receipt.findFirst({
    where: { tenantId, receiptNumber },
    include: { items: true },
  })

  if (!receipt) return null

  return {
    id: receipt.id,
    tenantId: receipt.tenantId,
    receiptNumber: receipt.receiptNumber,
    receiptType: receipt.receiptType,
    sourceType: receipt.sourceType,
    sourceId: receipt.sourceId,
    businessName: receipt.businessName,
    transactionDate: receipt.transactionDate,
    currency: receipt.currency,
    subtotal: Number(receipt.subtotal),
    grandTotal: Number(receipt.grandTotal),
    paymentMethod: receipt.paymentMethod,
    verificationQrCode: receipt.verificationQrCode ?? undefined,
    itemCount: receipt.items.length,
    createdAt: receipt.createdAt,
    metadata: {
      syncStatus: receipt.syncStatus,
      offlineId: receipt.offlineId,
      amountTendered: receipt.amountTendered ? Number(receipt.amountTendered) : null,
      changeGiven: receipt.changeGiven ? Number(receipt.changeGiven) : null,
    },
  }
}

/**
 * Resolves a ticket to canonical format
 */
export async function resolveTicket(
  tenantId: string,
  ticketNumber: string
): Promise<CanonicalTicket | null> {
  const ticket = await prisma.park_ticket.findFirst({
    where: { tenantId, ticketNumber },
  })

  if (!ticket) return null

  return {
    id: ticket.id,
    tenantId: ticket.tenantId,
    ticketNumber: ticket.ticketNumber,
    tripId: ticket.tripId,
    seatNumber: ticket.seatNumber ?? undefined,
    passengerName: ticket.passengerName,
    passengerPhone: ticket.passengerPhone ?? undefined,
    price: Number(ticket.price),
    totalPaid: Number(ticket.totalPaid),
    paymentMethod: ticket.paymentMethod,
    paymentStatus: ticket.paymentStatus,
    status: ticket.status,
    soldAt: ticket.soldAt,
    metadata: {
      saleChannel: ticket.saleChannel,
      soldById: ticket.soldById,
      soldByName: ticket.soldByName,
      roundingAmount: Number(ticket.roundingAmount),
      roundingMode: ticket.roundingMode,
    },
  }
}

/**
 * Resolves a manifest to canonical format
 */
export async function resolveManifest(
  tenantId: string,
  manifestNumber: string
): Promise<CanonicalManifest | null> {
  const manifest = await prisma.park_manifest.findFirst({
    where: { tenantId, manifestNumber },
  })

  if (!manifest) return null

  return {
    id: manifest.id,
    tenantId: manifest.tenantId,
    manifestNumber: manifest.manifestNumber,
    tripId: manifest.tripId,
    routeName: manifest.routeName,
    origin: manifest.origin,
    destination: manifest.destination,
    scheduledDeparture: manifest.scheduledDeparture ?? undefined,
    vehiclePlateNumber: manifest.vehiclePlateNumber ?? undefined,
    driverName: manifest.driverName ?? undefined,
    totalSeats: manifest.totalSeats,
    bookedSeats: manifest.bookedSeats,
    totalRevenue: Number(manifest.totalRevenue),
    status: manifest.status,
    generatedAt: manifest.generatedAt ?? undefined,
    metadata: {
      parkId: manifest.parkId,
      serialNumber: manifest.serialNumber,
      departureMode: manifest.departureMode,
      passengerCount: Array.isArray(manifest.passengerList) 
        ? (manifest.passengerList as unknown[]).length 
        : 0,
    },
  }
}

/**
 * Finds receipts linked to a source (order, ticket, etc.)
 * 
 * GAP: Receipt sourceType values are strings, not standardized enums.
 * Known values: POS_SALE, PARKHUB_QUEUE, PARKHUB_TICKET
 */
export async function findReceiptsBySource(
  tenantId: string,
  sourceType: string,
  sourceId: string
): Promise<CanonicalReceipt[]> {
  const receipts = await prisma.receipt.findMany({
    where: { tenantId, sourceType, sourceId },
    include: { items: true },
  })

  return receipts.map(receipt => ({
    id: receipt.id,
    tenantId: receipt.tenantId,
    receiptNumber: receipt.receiptNumber,
    receiptType: receipt.receiptType,
    sourceType: receipt.sourceType,
    sourceId: receipt.sourceId,
    businessName: receipt.businessName,
    transactionDate: receipt.transactionDate,
    currency: receipt.currency,
    subtotal: Number(receipt.subtotal),
    grandTotal: Number(receipt.grandTotal),
    paymentMethod: receipt.paymentMethod,
    verificationQrCode: receipt.verificationQrCode ?? undefined,
    itemCount: receipt.items.length,
    createdAt: receipt.createdAt,
    metadata: {
      syncStatus: receipt.syncStatus,
      offlineId: receipt.offlineId,
    },
  }))
}

/**
 * Finds tickets for a trip
 */
export async function findTicketsByTrip(
  tenantId: string,
  tripId: string
): Promise<CanonicalTicket[]> {
  const tickets = await prisma.park_ticket.findMany({
    where: { tenantId, tripId },
  })

  return tickets.map(ticket => ({
    id: ticket.id,
    tenantId: ticket.tenantId,
    ticketNumber: ticket.ticketNumber,
    tripId: ticket.tripId,
    seatNumber: ticket.seatNumber ?? undefined,
    passengerName: ticket.passengerName,
    passengerPhone: ticket.passengerPhone ?? undefined,
    price: Number(ticket.price),
    totalPaid: Number(ticket.totalPaid),
    paymentMethod: ticket.paymentMethod,
    paymentStatus: ticket.paymentStatus,
    status: ticket.status,
    soldAt: ticket.soldAt,
    metadata: {},
  }))
}

/**
 * Finds manifest for a trip
 */
export async function findManifestByTrip(
  tenantId: string,
  tripId: string
): Promise<CanonicalManifest | null> {
  const manifest = await prisma.park_manifest.findFirst({
    where: { tenantId, tripId },
  })

  if (!manifest) return null

  return {
    id: manifest.id,
    tenantId: manifest.tenantId,
    manifestNumber: manifest.manifestNumber,
    tripId: manifest.tripId,
    routeName: manifest.routeName,
    origin: manifest.origin,
    destination: manifest.destination,
    scheduledDeparture: manifest.scheduledDeparture ?? undefined,
    vehiclePlateNumber: manifest.vehiclePlateNumber ?? undefined,
    driverName: manifest.driverName ?? undefined,
    totalSeats: manifest.totalSeats,
    bookedSeats: manifest.bookedSeats,
    totalRevenue: Number(manifest.totalRevenue),
    status: manifest.status,
    generatedAt: manifest.generatedAt ?? undefined,
    metadata: {},
  }
}

/**
 * Builds a proof chain starting from an SVM order
 * 
 * GAP: SVM orders do not have direct FK to receipts.
 * Receipt linkage requires matching via sourceType='POS_SALE' + sourceId.
 * However, POS_SALE receipts reference pos_sale.id, not svm_orders.id.
 * This means SVM order → receipt resolution may fail.
 */
export async function buildProofFromSvmOrder(
  tenantId: string,
  orderId: string,
  orderNumber: string
): Promise<CanonicalProof> {
  const receipts = await findReceiptsBySource(tenantId, 'SVM_ORDER', orderId)

  return {
    orderReference: orderNumber,
    orderType: 'SVM',
    orderId,
    receiptNumbers: receipts.map(r => r.receiptNumber),
    receipts,
    ticketReferences: [],
    tickets: [],
    manifestNumbers: [],
    manifests: [],
    verificationUrls: receipts
      .filter(r => r.verificationQrCode)
      .map(r => r.verificationQrCode!),
    sourceSystems: ['SVM'],
    linkedAt: new Date(),
    metadata: {
      gapNotes: [
        'SVM orders do not have direct receipt FK',
        'Receipt linkage attempted via sourceType/sourceId match',
      ],
    },
  }
}

/**
 * Builds a proof chain starting from an MVM order
 * 
 * GAP: MVM parent orders may have multiple sub-orders,
 * each potentially with separate receipts.
 */
export async function buildProofFromMvmOrder(
  tenantId: string,
  orderId: string,
  orderNumber: string
): Promise<CanonicalProof> {
  const receipts = await findReceiptsBySource(tenantId, 'MVM_ORDER', orderId)

  return {
    orderReference: orderNumber,
    orderType: 'MVM',
    orderId,
    receiptNumbers: receipts.map(r => r.receiptNumber),
    receipts,
    ticketReferences: [],
    tickets: [],
    manifestNumbers: [],
    manifests: [],
    verificationUrls: receipts
      .filter(r => r.verificationQrCode)
      .map(r => r.verificationQrCode!),
    sourceSystems: ['MVM'],
    linkedAt: new Date(),
    metadata: {
      gapNotes: [
        'MVM parent orders may have sub-orders with separate receipts',
        'Receipt linkage attempted via sourceType/sourceId match',
      ],
    },
  }
}

/**
 * Builds a proof chain starting from a ParkHub ticket
 * 
 * ParkHub has the richest proof chain:
 * Ticket → Trip → Manifest
 * Ticket → Receipt (via PARKHUB_TICKET sourceType)
 */
export async function buildProofFromParkTicket(
  tenantId: string,
  ticketId: string,
  ticketNumber: string
): Promise<CanonicalProof> {
  const ticket = await resolveTicket(tenantId, ticketNumber)
  if (!ticket) {
    return {
      receiptNumbers: [],
      receipts: [],
      ticketReferences: [ticketNumber],
      tickets: [],
      manifestNumbers: [],
      manifests: [],
      verificationUrls: [],
      sourceSystems: ['PARKHUB'],
      linkedAt: new Date(),
      metadata: { error: 'Ticket not found' },
    }
  }

  const receipts = await findReceiptsBySource(tenantId, 'PARKHUB_TICKET', ticketId)

  const manifest = await findManifestByTrip(tenantId, ticket.tripId)

  return {
    orderReference: ticketNumber,
    orderType: 'PARKHUB',
    orderId: ticketId,
    receiptNumbers: receipts.map(r => r.receiptNumber),
    receipts,
    ticketReferences: [ticketNumber],
    tickets: [ticket],
    manifestNumbers: manifest ? [manifest.manifestNumber] : [],
    manifests: manifest ? [manifest] : [],
    verificationUrls: [
      ...receipts.filter(r => r.verificationQrCode).map(r => r.verificationQrCode!),
    ],
    sourceSystems: ['PARKHUB'],
    linkedAt: new Date(),
    metadata: {
      tripId: ticket.tripId,
    },
  }
}

/**
 * Builds a proof chain starting from a manifest
 */
export async function buildProofFromManifest(
  tenantId: string,
  manifestNumber: string
): Promise<CanonicalProof> {
  const manifest = await resolveManifest(tenantId, manifestNumber)
  if (!manifest) {
    return {
      receiptNumbers: [],
      receipts: [],
      ticketReferences: [],
      tickets: [],
      manifestNumbers: [manifestNumber],
      manifests: [],
      verificationUrls: [],
      sourceSystems: ['PARKHUB'],
      linkedAt: new Date(),
      metadata: { error: 'Manifest not found' },
    }
  }

  const tickets = await findTicketsByTrip(tenantId, manifest.tripId)

  const allReceipts: CanonicalReceipt[] = []
  for (const ticket of tickets) {
    const ticketReceipts = await findReceiptsBySource(
      tenantId, 
      'PARKHUB_TICKET', 
      ticket.id
    )
    allReceipts.push(...ticketReceipts)
  }

  return {
    orderReference: manifestNumber,
    orderType: 'PARKHUB',
    orderId: manifest.id,
    receiptNumbers: allReceipts.map(r => r.receiptNumber),
    receipts: allReceipts,
    ticketReferences: tickets.map(t => t.ticketNumber),
    tickets,
    manifestNumbers: [manifestNumber],
    manifests: [manifest],
    verificationUrls: allReceipts
      .filter(r => r.verificationQrCode)
      .map(r => r.verificationQrCode!),
    sourceSystems: ['PARKHUB'],
    linkedAt: new Date(),
    metadata: {
      tripId: manifest.tripId,
      ticketCount: tickets.length,
    },
  }
}
