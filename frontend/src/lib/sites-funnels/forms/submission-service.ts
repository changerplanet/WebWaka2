/**
 * Form Submission Service - Phase E1.3
 * 
 * Handles form submissions with optional payment integration
 */

import { prisma } from '@/lib/prisma'
import { PaymentExecutionService } from '@/lib/payment-execution'
import {
  Form,
  FormSubmission,
  SubmissionStatus,
  SubmitFormInput,
  SubmitFormResult,
  ListSubmissionsOptions,
  FormFieldDefinition,
  ValidationRule
} from './types'
import { getForm, getPublicForm, incrementSubmissionCount } from './form-service'
import { sf_SubmissionStatus } from '@prisma/client'

function mapDbSubmissionToSubmission(dbSub: any): FormSubmission {
  return {
    id: dbSub.id,
    formId: dbSub.formId,
    tenantId: dbSub.tenantId,
    data: dbSub.data as Record<string, any>,
    status: dbSub.status as SubmissionStatus,
    submitterEmail: dbSub.submitterEmail,
    submitterName: dbSub.submitterName,
    submitterPhone: dbSub.submitterPhone,
    ipAddress: dbSub.ipAddress,
    userAgent: dbSub.userAgent,
    referrer: dbSub.referrer,
    utmSource: dbSub.utmSource,
    utmMedium: dbSub.utmMedium,
    utmCampaign: dbSub.utmCampaign,
    paymentRequired: dbSub.paymentRequired,
    paymentAmount: dbSub.paymentAmount ? Number(dbSub.paymentAmount) : null,
    paymentCurrency: dbSub.paymentCurrency,
    paymentTransactionId: dbSub.paymentTransactionId,
    paymentReference: dbSub.paymentReference,
    paymentStatus: dbSub.paymentStatus,
    paidAt: dbSub.paidAt,
    createdAt: dbSub.createdAt,
    completedAt: dbSub.completedAt,
    isDemo: dbSub.isDemo
  }
}

function validateFieldValue(
  value: any,
  field: FormFieldDefinition
): { valid: boolean; error?: string } {
  const rules = field.validation || []
  
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          return { valid: false, error: rule.message || `${field.label} is required` }
        }
        break
        
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
          return { valid: false, error: rule.message || 'Invalid email format' }
        }
        break
        
      case 'phone':
        if (value && !/^[0-9+\-\s()]{7,20}$/.test(String(value))) {
          return { valid: false, error: rule.message || 'Invalid phone format' }
        }
        break
        
      case 'minLength':
        if (value && String(value).length < Number(rule.value)) {
          return { valid: false, error: rule.message || `Minimum ${rule.value} characters required` }
        }
        break
        
      case 'maxLength':
        if (value && String(value).length > Number(rule.value)) {
          return { valid: false, error: rule.message || `Maximum ${rule.value} characters allowed` }
        }
        break
        
      case 'min':
        if (value !== undefined && Number(value) < Number(rule.value)) {
          return { valid: false, error: rule.message || `Minimum value is ${rule.value}` }
        }
        break
        
      case 'max':
        if (value !== undefined && Number(value) > Number(rule.value)) {
          return { valid: false, error: rule.message || `Maximum value is ${rule.value}` }
        }
        break
        
      case 'pattern':
        if (value && rule.value && !new RegExp(String(rule.value)).test(String(value))) {
          return { valid: false, error: rule.message || 'Invalid format' }
        }
        break
    }
  }
  
  return { valid: true }
}

function validateFormData(
  data: Record<string, any>,
  form: Form
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  
  for (const field of form.schema.fields) {
    const value = data[field.name]
    const validation = validateFieldValue(value, field)
    
    if (!validation.valid && validation.error) {
      errors[field.name] = validation.error
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

export async function submitForm(input: SubmitFormInput): Promise<SubmitFormResult> {
  try {
    const form = await getPublicForm(input.formId)
    
    if (!form) {
      return { success: false, error: 'Form not found or not active' }
    }
    
    const validation = validateFormData(input.data, form)
    if (!validation.valid) {
      return { 
        success: false, 
        error: 'Validation failed: ' + Object.values(validation.errors).join(', ')
      }
    }
    
    const emailField = form.schema.fields.find(f => f.type === 'email')
    const nameField = form.schema.fields.find(f => f.name === 'name' || f.name === 'fullName')
    const phoneField = form.schema.fields.find(f => f.type === 'phone')
    
    const submitterEmail = input.submitterEmail || (emailField ? input.data[emailField.name] : null)
    const submitterName = input.submitterName || (nameField ? input.data[nameField.name] : null)
    const submitterPhone = input.submitterPhone || (phoneField ? input.data[phoneField.name] : null)
    
    const initialStatus = form.paymentEnabled 
      ? sf_SubmissionStatus.PAYMENT_PENDING 
      : sf_SubmissionStatus.COMPLETED
    
    const dbSubmission = await prisma.sf_form_submissions.create({
      data: {
        formId: input.formId,
        tenantId: form.tenantId,
        data: input.data as any,
        status: initialStatus,
        submitterEmail,
        submitterName,
        submitterPhone,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        referrer: input.referrer,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        paymentRequired: form.paymentEnabled,
        paymentAmount: form.paymentAmount,
        paymentCurrency: form.paymentCurrency,
        isDemo: form.isDemo
      }
    })
    
    if (form.paymentEnabled && form.paymentAmount && form.paymentAmount > 0) {
      if (!submitterEmail) {
        return { success: false, error: 'Email is required for payment forms' }
      }
      
      const paymentResult = await PaymentExecutionService.initiatePayment({
        tenantId: form.tenantId,
        partnerId: form.partnerId,
        amount: form.paymentAmount,
        currency: form.paymentCurrency,
        customerEmail: submitterEmail,
        customerName: submitterName || undefined,
        sourceModule: 'forms',
        sourceType: 'form_submission',
        sourceId: dbSubmission.id,
        callbackUrl: input.callbackUrl,
        metadata: {
          formId: form.id,
          formName: form.name,
          submissionId: dbSubmission.id
        }
      })
      
      if (paymentResult.success && paymentResult.transactionId) {
        await prisma.sf_form_submissions.update({
          where: { id: dbSubmission.id },
          data: {
            paymentTransactionId: paymentResult.transactionId,
            paymentReference: paymentResult.reference,
            paymentStatus: 'PENDING'
          }
        })
        
        return {
          success: true,
          submissionId: dbSubmission.id,
          status: 'PAYMENT_PENDING',
          paymentRequired: true,
          paymentUrl: paymentResult.authorizationUrl,
          paymentReference: paymentResult.reference
        }
      } else {
        await prisma.sf_form_submissions.update({
          where: { id: dbSubmission.id },
          data: {
            status: sf_SubmissionStatus.PAYMENT_FAILED,
            paymentStatus: 'FAILED'
          }
        })
        
        return {
          success: false,
          submissionId: dbSubmission.id,
          error: paymentResult.error || 'Payment initiation failed'
        }
      }
    }
    
    await prisma.sf_form_submissions.update({
      where: { id: dbSubmission.id },
      data: {
        status: sf_SubmissionStatus.COMPLETED,
        completedAt: new Date()
      }
    })
    
    await incrementSubmissionCount(form.id)
    
    return {
      success: true,
      submissionId: dbSubmission.id,
      status: 'COMPLETED',
      paymentRequired: false,
      redirectUrl: form.successRedirectUrl || undefined,
      message: form.successMessage || 'Form submitted successfully'
    }
  } catch (error: any) {
    console.error('submitForm error:', error)
    return { success: false, error: error.message || 'Failed to submit form' }
  }
}

export async function verifySubmissionPayment(
  submissionId: string,
  tenantId: string
): Promise<SubmitFormResult> {
  try {
    const dbSubmission = await prisma.sf_form_submissions.findFirst({
      where: { id: submissionId, tenantId }
    })
    
    if (!dbSubmission) {
      return { success: false, error: 'Submission not found' }
    }
    
    if (!dbSubmission.paymentReference) {
      return { success: false, error: 'No payment reference found' }
    }
    
    const form = await getForm(dbSubmission.formId, tenantId)
    if (!form) {
      return { success: false, error: 'Form not found' }
    }
    
    const verifyResult = await PaymentExecutionService.verifyPayment({
      tenantId,
      partnerId: form.partnerId,
      reference: dbSubmission.paymentReference
    })
    
    if (verifyResult.success && verifyResult.status === 'SUCCESS') {
      await prisma.sf_form_submissions.update({
        where: { id: submissionId },
        data: {
          status: sf_SubmissionStatus.PAYMENT_COMPLETED,
          paymentStatus: 'SUCCESS',
          paidAt: verifyResult.paidAt || new Date(),
          completedAt: new Date()
        }
      })
      
      await incrementSubmissionCount(form.id, true, form.paymentAmount || 0)
      
      return {
        success: true,
        submissionId,
        status: 'PAYMENT_COMPLETED',
        redirectUrl: form.successRedirectUrl || undefined,
        message: form.successMessage || 'Payment completed successfully'
      }
    } else if (verifyResult.status === 'FAILED') {
      await prisma.sf_form_submissions.update({
        where: { id: submissionId },
        data: {
          status: sf_SubmissionStatus.PAYMENT_FAILED,
          paymentStatus: 'FAILED'
        }
      })
      
      return {
        success: false,
        submissionId,
        status: 'PAYMENT_FAILED',
        error: 'Payment failed'
      }
    }
    
    return {
      success: true,
      submissionId,
      status: dbSubmission.status as SubmissionStatus,
      message: 'Payment still pending'
    }
  } catch (error: any) {
    console.error('verifySubmissionPayment error:', error)
    return { success: false, error: error.message || 'Failed to verify payment' }
  }
}

export async function getSubmission(
  submissionId: string,
  tenantId: string
): Promise<FormSubmission | null> {
  const dbSub = await prisma.sf_form_submissions.findFirst({
    where: { id: submissionId, tenantId }
  })
  
  return dbSub ? mapDbSubmissionToSubmission(dbSub) : null
}

export async function listSubmissions(
  tenantId: string,
  options: ListSubmissionsOptions = {}
): Promise<{ submissions: FormSubmission[]; total: number; page: number; limit: number }> {
  const {
    formId,
    status,
    submitterEmail,
    includeDemo = false,
    fromDate,
    toDate,
    page = 1,
    limit = 50
  } = options

  const where: any = { tenantId }
  
  if (formId) where.formId = formId
  if (status) where.status = status as sf_SubmissionStatus
  if (submitterEmail) where.submitterEmail = { contains: submitterEmail, mode: 'insensitive' }
  if (!includeDemo) where.isDemo = false
  if (fromDate) where.createdAt = { gte: fromDate }
  if (toDate) {
    where.createdAt = { ...where.createdAt, lte: toDate }
  }

  const [dbSubs, total] = await Promise.all([
    prisma.sf_form_submissions.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.sf_form_submissions.count({ where })
  ])

  return {
    submissions: dbSubs.map(mapDbSubmissionToSubmission),
    total,
    page,
    limit
  }
}

export async function completeSubmissionDemo(
  submissionId: string
): Promise<{ success: boolean; submission?: FormSubmission; error?: string }> {
  try {
    const dbSub = await prisma.sf_form_submissions.findFirst({
      where: { id: submissionId, isDemo: true }
    })
    
    if (!dbSub) {
      return { success: false, error: 'Demo submission not found' }
    }
    
    const form = await getForm(dbSub.formId, dbSub.tenantId)
    if (!form) {
      return { success: false, error: 'Form not found' }
    }
    
    const newStatus = dbSub.paymentRequired 
      ? sf_SubmissionStatus.PAYMENT_COMPLETED 
      : sf_SubmissionStatus.COMPLETED
    
    const updated = await prisma.sf_form_submissions.update({
      where: { id: submissionId },
      data: {
        status: newStatus,
        paymentStatus: dbSub.paymentRequired ? 'SUCCESS' : null,
        paidAt: dbSub.paymentRequired ? new Date() : null,
        completedAt: new Date()
      }
    })
    
    await incrementSubmissionCount(form.id, dbSub.paymentRequired, form.paymentAmount || 0)
    
    return { success: true, submission: mapDbSubmissionToSubmission(updated) }
  } catch (error: any) {
    console.error('completeSubmissionDemo error:', error)
    return { success: false, error: error.message || 'Failed to complete demo submission' }
  }
}
