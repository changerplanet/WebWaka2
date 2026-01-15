/**
 * Payment Verification Types
 * Wave 2.2: Bank Transfer & COD Deepening
 */

export type BankTransferStatus =
  | 'PENDING_PROOF'
  | 'PROOF_SUBMITTED'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export type CodStatus =
  | 'PENDING_DELIVERY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED_PENDING'
  | 'COLLECTED'
  | 'PARTIAL_COLLECTED'
  | 'FAILED'
  | 'RETURNED'
  | 'RECONCILED';

export type VerificationDecision = 'APPROVED' | 'REJECTED' | 'NEEDS_MORE_INFO';

export interface BankAccountDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface CreateBankTransferRequest {
  tenantId: string;
  orderId?: string;
  orderNumber?: string;
  amount: number;
  currency?: string;
  bankAccount: BankAccountDetails;
  customerPhone?: string;
  customerEmail?: string;
  customerName?: string;
  expiryHours?: number;
}

export interface BankTransferPayment {
  id: string;
  tenantId: string;
  orderId?: string;
  orderNumber?: string;
  amount: number;
  currency: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  paymentReference: string;
  customerReference?: string;
  status: BankTransferStatus;
  createdAt: Date;
  expiresAt: Date;
  proofSubmittedAt?: Date;
  verifiedAt?: Date;
  customerPhone?: string;
  customerEmail?: string;
  customerName?: string;
  verifiedById?: string;
  verifiedByName?: string;
  verificationNote?: string;
  rejectionReason?: string;
}

export interface SubmitProofRequest {
  paymentId: string;
  proofType: 'SCREENSHOT' | 'RECEIPT' | 'STATEMENT';
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  extractedAmount?: number;
  extractedReference?: string;
  extractedDate?: Date;
  extractedBankName?: string;
  submittedById?: string;
  submittedByName?: string;
}

export interface VerifyPaymentRequest {
  paymentId: string;
  decision: VerificationDecision;
  note?: string;
  verifiedById: string;
  verifiedByName: string;
  customerReference?: string;
}

export interface CreateCodRequest {
  tenantId: string;
  orderId: string;
  orderNumber?: string;
  expectedAmount: number;
  currency?: string;
  customerPhone?: string;
  customerName?: string;
  deliveryAddress?: string;
}

export interface CodPayment {
  id: string;
  tenantId: string;
  orderId: string;
  orderNumber?: string;
  expectedAmount: number;
  collectedAmount?: number;
  currency: string;
  status: CodStatus;
  createdAt: Date;
  deliveryAgentId?: string;
  deliveryAgentName?: string;
  assignedAt?: Date;
  deliveredAt?: Date;
  collectedAt?: Date;
  collectedById?: string;
  collectedByName?: string;
  collectionMethod?: string;
  reconciledAt?: Date;
  customerPhone?: string;
  customerName?: string;
  deliveryAddress?: string;
  failureReason?: string;
  returnReason?: string;
  notes?: string;
}

export interface AssignDeliveryAgentRequest {
  codPaymentId: string;
  agentId: string;
  agentName: string;
}

export interface CollectCodRequest {
  codPaymentId: string;
  collectedAmount: number;
  collectionMethod: 'CASH' | 'POS' | 'MOBILE_MONEY';
  collectedById: string;
  collectedByName: string;
  notes?: string;
}

export interface ReconcileCodRequest {
  codPaymentId: string;
  reconciledById: string;
  reconciledByName: string;
  reconciliationRef?: string;
}

export interface MarkCodFailedRequest {
  codPaymentId: string;
  reason: string;
  markedById: string;
  markedByName: string;
}

export interface VerificationQueueItem {
  id: string;
  tenantId: string;
  paymentType: 'BANK_TRANSFER' | 'COD';
  paymentId: string;
  priority: number;
  assignedToId?: string;
  assignedToName?: string;
  assignedAt?: Date;
  decision?: VerificationDecision;
  decisionNote?: string;
  decidedAt?: Date;
  createdAt: Date;
  dueBy?: Date;
  isUrgent: boolean;
  needsEscalation: boolean;
}
