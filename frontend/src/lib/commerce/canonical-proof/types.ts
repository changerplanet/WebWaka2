/**
 * CANONICAL PROOF TYPES
 * Wave J.3: Receipt & Proof Linking (Read-Only)
 * 
 * These interfaces provide a normalized view of proof documents
 * (receipts, tickets, manifests) and their linkages to orders.
 * 
 * CONSTRAINTS:
 * - ❌ No schema changes - read-only abstraction
 * - ❌ No data mutations - these are view models only
 * - ❌ No link creation - only traverse existing relationships
 * - ✅ Maps existing data to canonical format
 * 
 * @module lib/commerce/canonical-proof/types
 */

export type ProofSourceSystem = 'SVM' | 'MVM' | 'PARKHUB'

export type ProofDocumentType = 'RECEIPT' | 'TICKET' | 'MANIFEST'

export interface CanonicalReceipt {
  id: string
  tenantId: string
  receiptNumber: string
  receiptType: string
  sourceType: string
  sourceId: string
  businessName: string
  transactionDate: Date
  currency: string
  subtotal: number
  grandTotal: number
  paymentMethod: string
  verificationQrCode?: string
  itemCount: number
  createdAt: Date
  metadata: Record<string, unknown>
}

export interface CanonicalTicket {
  id: string
  tenantId: string
  ticketNumber: string
  tripId: string
  seatNumber?: string
  passengerName: string
  passengerPhone?: string
  price: number
  totalPaid: number
  paymentMethod: string
  paymentStatus: string
  status: string
  soldAt: Date
  metadata: Record<string, unknown>
}

export interface CanonicalManifest {
  id: string
  tenantId: string
  manifestNumber: string
  tripId: string
  routeName: string
  origin: string
  destination: string
  scheduledDeparture?: Date
  vehiclePlateNumber?: string
  driverName?: string
  totalSeats: number
  bookedSeats: number
  totalRevenue: number
  status: string
  generatedAt?: Date
  metadata: Record<string, unknown>
}

export interface CanonicalProof {
  orderReference?: string
  orderType?: ProofSourceSystem
  orderId?: string
  receiptNumbers: string[]
  receipts: CanonicalReceipt[]
  ticketReferences: string[]
  tickets: CanonicalTicket[]
  manifestNumbers: string[]
  manifests: CanonicalManifest[]
  verificationUrls: string[]
  sourceSystems: ProofSourceSystem[]
  linkedAt: Date
  metadata: Record<string, unknown>
}

export interface ProofLinkageResult {
  success: boolean
  proof?: CanonicalProof
  error?: string
}

export interface ProofCoverageMatrix {
  system: ProofSourceSystem
  canResolveReceipt: boolean
  canResolveTicket: boolean
  canResolveManifest: boolean
  notes: string[]
}
