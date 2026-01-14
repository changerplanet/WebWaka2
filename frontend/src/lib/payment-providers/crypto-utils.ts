/**
 * Cryptographic Utilities for Payment Provider Secrets
 * 
 * Phase E1.1: Secure encryption for Paystack credentials
 * 
 * Uses AES-256-GCM for authenticated encryption of sensitive data.
 * The encryption key should be stored as an environment variable.
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32

function getEncryptionKey(): Buffer {
  const keyEnv = process.env.PAYMENT_ENCRYPTION_KEY
  
  if (!keyEnv) {
    throw new Error(
      'PAYMENT_ENCRYPTION_KEY environment variable is required for payment credential encryption. ' +
      'Set this to a secure random string (at least 32 characters). ' +
      'See docs/PAYSTACK_INTEGRATION.md for details.'
    )
  }
  
  if (keyEnv.length < 32) {
    throw new Error('PAYMENT_ENCRYPTION_KEY must be at least 32 characters long for security.')
  }
  
  return crypto.scryptSync(keyEnv, 'payment-provider-secrets', 32)
}

/**
 * Check if encryption is properly configured (for UI display)
 */
export function isEncryptionConfigured(): boolean {
  const keyEnv = process.env.PAYMENT_ENCRYPTION_KEY
  return !!(keyEnv && keyEnv.length >= 32)
}

/**
 * Encrypt a secret value using AES-256-GCM
 * Returns a base64-encoded string containing: salt + iv + authTag + encrypted
 */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const salt = crypto.randomBytes(SALT_LENGTH)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  const combined = Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'hex')
  ])
  
  return combined.toString('base64')
}

/**
 * Decrypt a secret value encrypted with encryptSecret
 */
export function decryptSecret(encryptedBase64: string): string {
  try {
    const combined = Buffer.from(encryptedBase64, 'base64')
    
    const salt = combined.subarray(0, SALT_LENGTH)
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)
    
    const key = getEncryptionKey()
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Failed to decrypt secret:', error)
    throw new Error('Failed to decrypt payment credentials')
  }
}

/**
 * Mask a secret key for display (shows only last 4 characters)
 */
export function maskSecret(secret: string | null | undefined): string | null {
  if (!secret) return null
  
  if (secret.length <= 4) {
    return '••••'
  }
  
  return '••••••••••••' + secret.slice(-4)
}

/**
 * Validate that a public key has the expected Paystack format
 */
export function isValidPaystackPublicKey(key: string): boolean {
  return key.startsWith('pk_test_') || key.startsWith('pk_live_')
}

/**
 * Validate that a secret key has the expected Paystack format
 */
export function isValidPaystackSecretKey(key: string): boolean {
  return key.startsWith('sk_test_') || key.startsWith('sk_live_')
}
