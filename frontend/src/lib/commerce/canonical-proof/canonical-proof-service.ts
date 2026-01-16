/**
 * CANONICAL PROOF SERVICE
 * Wave J.3: Receipt & Proof Linking (Read-Only)
 * 
 * High-level service for traversing proof linkages across orders,
 * receipts, tickets, and manifests.
 * 
 * CONSTRAINTS:
 * - ❌ No schema changes
 * - ❌ No data mutations
 * - ❌ No link creation
 * - ✅ Read-only traversal
 * - ✅ Tenant isolation enforced
 * 
 * @module lib/commerce/canonical-proof/canonical-proof-service
 */

import { prisma } from '../../prisma'
import { 
  CanonicalProof,
  CanonicalReceipt,
  CanonicalTicket,
  CanonicalManifest,
  ProofCoverageMatrix,
} from './types'
import {
  resolveReceipt,
  resolveTicket,
  resolveManifest,
  buildProofFromSvmOrder,
  buildProofFromMvmOrder,
  buildProofFromParkTicket,
  buildProofFromManifest,
  findReceiptsBySource,
} from './resolvers'

/**
 * Gets proof chain by order reference
 * 
 * Attempts resolution in order: SVM → MVM → ParkHub
 */
export async function getProofByOrder(
  tenantId: string,
  orderReference: string
): Promise<CanonicalProof | null> {
  const svmOrder = await prisma.svm_orders.findFirst({
    where: { tenantId, orderNumber: orderReference },
  })
  if (svmOrder) {
    return buildProofFromSvmOrder(tenantId, svmOrder.id, svmOrder.orderNumber)
  }

  const mvmOrder = await prisma.mvm_parent_order.findFirst({
    where: { tenantId, orderNumber: orderReference },
  })
  if (mvmOrder) {
    return buildProofFromMvmOrder(tenantId, mvmOrder.id, mvmOrder.orderNumber)
  }

  const ticket = await prisma.park_ticket.findFirst({
    where: { tenantId, ticketNumber: orderReference },
  })
  if (ticket) {
    return buildProofFromParkTicket(tenantId, ticket.id, ticket.ticketNumber)
  }

  return null
}

/**
 * Gets proof chain by receipt number
 * 
 * Follows receipt → source → related proofs
 */
export async function getProofByReceipt(
  tenantId: string,
  receiptNumber: string
): Promise<CanonicalProof | null> {
  const receipt = await resolveReceipt(tenantId, receiptNumber)
  if (!receipt) return null

  if (receipt.sourceType === 'PARKHUB_TICKET') {
    const ticket = await prisma.park_ticket.findUnique({
      where: { id: receipt.sourceId },
    })
    if (ticket && ticket.tenantId === tenantId) {
      return buildProofFromParkTicket(tenantId, ticket.id, ticket.ticketNumber)
    }
  }

  return {
    orderReference: receipt.sourceId,
    orderType: receipt.sourceType.startsWith('PARKHUB') ? 'PARKHUB' : 
               receipt.sourceType.startsWith('MVM') ? 'MVM' : 'SVM',
    orderId: receipt.sourceId,
    receiptNumbers: [receiptNumber],
    receipts: [receipt],
    ticketReferences: [],
    tickets: [],
    manifestNumbers: [],
    manifests: [],
    verificationUrls: receipt.verificationQrCode ? [receipt.verificationQrCode] : [],
    sourceSystems: [receipt.sourceType.startsWith('PARKHUB') ? 'PARKHUB' : 
                    receipt.sourceType.startsWith('MVM') ? 'MVM' : 'SVM'],
    linkedAt: new Date(),
    metadata: {
      sourceType: receipt.sourceType,
      sourceId: receipt.sourceId,
    },
  }
}

/**
 * Gets proof chain by ticket number
 */
export async function getProofByTicket(
  tenantId: string,
  ticketNumber: string
): Promise<CanonicalProof | null> {
  const ticket = await prisma.park_ticket.findFirst({
    where: { tenantId, ticketNumber },
  })
  if (!ticket) return null

  return buildProofFromParkTicket(tenantId, ticket.id, ticket.ticketNumber)
}

/**
 * Gets proof chain by manifest number
 */
export async function getProofByManifest(
  tenantId: string,
  manifestNumber: string
): Promise<CanonicalProof | null> {
  const manifest = await prisma.park_manifest.findFirst({
    where: { tenantId, manifestNumber },
  })
  if (!manifest) return null

  return buildProofFromManifest(tenantId, manifestNumber)
}

/**
 * Returns the proof coverage matrix
 * 
 * Documents which proof types can be resolved for each system
 */
export function getCoverageMatrix(): ProofCoverageMatrix[] {
  return [
    {
      system: 'SVM',
      canResolveReceipt: false,
      canResolveTicket: false,
      canResolveManifest: false,
      notes: [
        'SVM orders have no direct FK to receipts',
        'Receipt linkage requires sourceType=SVM_ORDER match (not implemented in receipt creation)',
        'SVM has no ticket or manifest concept',
      ],
    },
    {
      system: 'MVM',
      canResolveReceipt: false,
      canResolveTicket: false,
      canResolveManifest: false,
      notes: [
        'MVM orders have no direct FK to receipts',
        'Receipt linkage requires sourceType=MVM_ORDER match (not implemented in receipt creation)',
        'MVM has no ticket or manifest concept',
      ],
    },
    {
      system: 'PARKHUB',
      canResolveReceipt: true,
      canResolveTicket: true,
      canResolveManifest: true,
      notes: [
        'Receipts link via sourceType=PARKHUB_TICKET + sourceId',
        'Tickets contain tripId for manifest linkage',
        'Manifests contain tripId for ticket association',
        'Full proof chain: Ticket → Receipt + Manifest',
      ],
    },
  ]
}

export const CanonicalProofService = {
  getProofByOrder,
  getProofByReceipt,
  getProofByTicket,
  getProofByManifest,
  getCoverageMatrix,
}
