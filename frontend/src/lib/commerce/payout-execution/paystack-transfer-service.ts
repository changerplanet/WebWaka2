/**
 * Paystack Transfer Service
 * Wave L.1: Payout Execution (Live Money Movement)
 * 
 * Executes bank transfers via Paystack Transfer API.
 * - Recipient creation/resolution
 * - Transfer initiation
 * - Transfer verification
 * 
 * CONSTRAINTS:
 * - NO automation
 * - NO background jobs
 * - NO retries
 * - Admin/Partner triggered only
 * - Full audit trail
 */

import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const PAYSTACK_BASE_URL = 'https://api.paystack.co'

export interface TransferRecipient {
  recipientCode: string
  bankCode: string
  accountNumber: string
  accountName: string
  bankName: string
}

export interface TransferResult {
  success: boolean
  transferCode?: string
  reference: string
  status: 'SUCCESS' | 'PENDING' | 'FAILED'
  amount: number
  currency: string
  recipientCode?: string
  gatewayResponse?: string
  errorMessage?: string
  errorCode?: string
}

export interface TransferVerificationResult {
  success: boolean
  transferCode: string
  reference: string
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REVERSED'
  amount: number
  recipientCode?: string
  gatewayResponse?: string
  errorMessage?: string
}

async function getPaystackSecretKey(tenantId: string): Promise<string | null> {
  const partnerReferral = await prisma.partnerReferral.findUnique({
    where: { tenantId },
    select: { partnerId: true }
  })

  if (!partnerReferral?.partnerId) {
    return null
  }

  const config = await prisma.partnerPaymentConfig.findFirst({
    where: {
      partnerId: partnerReferral.partnerId,
      provider: 'paystack',
      enabledBySuperAdmin: true
    },
    select: {
      secretKeyEncrypted: true,
      metadata: true
    }
  })

  if (!config?.secretKeyEncrypted) {
    return null
  }

  const encryptionKey = process.env.PAYMENT_ENCRYPTION_KEY
  if (!encryptionKey) {
    console.error('PAYMENT_ENCRYPTION_KEY not configured')
    return null
  }

  try {
    const metadata = config.metadata as { encryptionIv?: string } | null
    const iv = metadata?.encryptionIv
    if (!iv) {
      console.error('Encryption IV not found in metadata')
      return null
    }

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(encryptionKey, 'hex'),
      Buffer.from(iv, 'hex')
    )
    const authTagLength = 16
    const encrypted = Buffer.from(config.secretKeyEncrypted, 'hex')
    const authTag = encrypted.slice(-authTagLength)
    const ciphertext = encrypted.slice(0, -authTagLength)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(ciphertext)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString('utf8')
  } catch (error) {
    console.error('Failed to decrypt Paystack secret key:', error)
    return null
  }
}

export const PaystackTransferService = {
  /**
   * Create or get existing transfer recipient
   * Recipients are identified by bank code + account number
   */
  async createRecipient(
    tenantId: string,
    bankCode: string,
    accountNumber: string,
    accountName: string
  ): Promise<{ success: boolean; recipientCode?: string; error?: string }> {
    const secretKey = await getPaystackSecretKey(tenantId)
    if (!secretKey) {
      return { success: false, error: 'Paystack credentials not configured' }
    }

    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'nuban',
          name: accountName,
          account_number: accountNumber,
          bank_code: bankCode,
          currency: 'NGN'
        })
      })

      const data = await response.json()

      if (!response.ok || !data.status) {
        return {
          success: false,
          error: data.message || 'Failed to create transfer recipient'
        }
      }

      return {
        success: true,
        recipientCode: data.data.recipient_code
      }
    } catch (error) {
      console.error('Paystack create recipient error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  },

  /**
   * Initiate a bank transfer
   * Amount is in kobo (NGN smallest unit)
   */
  async initiateTransfer(
    tenantId: string,
    recipientCode: string,
    amountKobo: number,
    reference: string,
    reason?: string
  ): Promise<TransferResult> {
    const secretKey = await getPaystackSecretKey(tenantId)
    if (!secretKey) {
      return {
        success: false,
        reference,
        status: 'FAILED',
        amount: amountKobo,
        currency: 'NGN',
        errorMessage: 'Paystack credentials not configured',
        errorCode: 'CREDENTIALS_MISSING'
      }
    }

    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: 'balance',
          amount: amountKobo,
          recipient: recipientCode,
          reference,
          reason: reason || 'Vendor payout'
        })
      })

      const data = await response.json()

      if (!response.ok || !data.status) {
        return {
          success: false,
          reference,
          status: 'FAILED',
          amount: amountKobo,
          currency: 'NGN',
          errorMessage: data.message || 'Transfer initiation failed',
          errorCode: data.code
        }
      }

      const transferStatus = data.data.status === 'success' ? 'SUCCESS' :
                            data.data.status === 'pending' ? 'PENDING' : 'FAILED'

      return {
        success: true,
        transferCode: data.data.transfer_code,
        reference: data.data.reference || reference,
        status: transferStatus,
        amount: data.data.amount,
        currency: data.data.currency,
        recipientCode: data.data.recipient,
        gatewayResponse: data.data.status
      }
    } catch (error) {
      console.error('Paystack transfer error:', error)
      return {
        success: false,
        reference,
        status: 'FAILED',
        amount: amountKobo,
        currency: 'NGN',
        errorMessage: error instanceof Error ? error.message : 'Network error',
        errorCode: 'NETWORK_ERROR'
      }
    }
  },

  /**
   * Verify transfer status
   */
  async verifyTransfer(
    tenantId: string,
    transferCode: string
  ): Promise<TransferVerificationResult> {
    const secretKey = await getPaystackSecretKey(tenantId)
    if (!secretKey) {
      return {
        success: false,
        transferCode,
        reference: '',
        status: 'FAILED',
        amount: 0,
        errorMessage: 'Paystack credentials not configured'
      }
    }

    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}/transfer/${transferCode}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`
        }
      })

      const data = await response.json()

      if (!response.ok || !data.status) {
        return {
          success: false,
          transferCode,
          reference: '',
          status: 'FAILED',
          amount: 0,
          errorMessage: data.message || 'Transfer verification failed'
        }
      }

      const status = data.data.status === 'success' ? 'SUCCESS' :
                     data.data.status === 'reversed' ? 'REVERSED' :
                     data.data.status === 'pending' ? 'PENDING' : 'FAILED'

      return {
        success: true,
        transferCode: data.data.transfer_code,
        reference: data.data.reference,
        status,
        amount: data.data.amount,
        recipientCode: data.data.recipient?.recipient_code,
        gatewayResponse: data.data.status
      }
    } catch (error) {
      console.error('Paystack transfer verification error:', error)
      return {
        success: false,
        transferCode,
        reference: '',
        status: 'FAILED',
        amount: 0,
        errorMessage: error instanceof Error ? error.message : 'Network error'
      }
    }
  },

  /**
   * Resolve bank account (verify account exists)
   */
  async resolveAccount(
    tenantId: string,
    accountNumber: string,
    bankCode: string
  ): Promise<{ success: boolean; accountName?: string; error?: string }> {
    const secretKey = await getPaystackSecretKey(tenantId)
    if (!secretKey) {
      return { success: false, error: 'Paystack credentials not configured' }
    }

    try {
      const response = await fetch(
        `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${secretKey}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok || !data.status) {
        return {
          success: false,
          error: data.message || 'Account resolution failed'
        }
      }

      return {
        success: true,
        accountName: data.data.account_name
      }
    } catch (error) {
      console.error('Paystack account resolution error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  },

  /**
   * Get Paystack balance (for sanity checks)
   */
  async getBalance(
    tenantId: string
  ): Promise<{ success: boolean; balance?: number; error?: string }> {
    const secretKey = await getPaystackSecretKey(tenantId)
    if (!secretKey) {
      return { success: false, error: 'Paystack credentials not configured' }
    }

    try {
      const response = await fetch(`${PAYSTACK_BASE_URL}/balance`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`
        }
      })

      const data = await response.json()

      if (!response.ok || !data.status) {
        return {
          success: false,
          error: data.message || 'Balance check failed'
        }
      }

      const ngnBalance = data.data.find((b: any) => b.currency === 'NGN')
      return {
        success: true,
        balance: ngnBalance?.balance || 0
      }
    } catch (error) {
      console.error('Paystack balance check error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  },

  /**
   * Simulate transfer for demo mode
   */
  simulateTransfer(
    reference: string,
    amountKobo: number
  ): TransferResult {
    return {
      success: true,
      transferCode: `DEMO-TRF-${Date.now()}`,
      reference,
      status: 'SUCCESS',
      amount: amountKobo,
      currency: 'NGN',
      recipientCode: `DEMO-RCP-${Date.now()}`,
      gatewayResponse: 'success (demo)'
    }
  }
}
