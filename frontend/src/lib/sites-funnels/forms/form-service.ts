/**
 * Form Service - Phase E1.3
 * 
 * CRUD operations for schema-driven forms
 */

import { prisma } from '@/lib/prisma'
import {
  Form,
  FormSchema,
  FormStatus,
  CreateFormInput,
  UpdateFormInput,
  ListFormsOptions
} from './types'
import { sf_FormStatus } from '@prisma/client'

function mapDbFormToForm(dbForm: any): Form {
  return {
    id: dbForm.id,
    tenantId: dbForm.tenantId,
    partnerId: dbForm.partnerId,
    platformInstanceId: dbForm.platformInstanceId,
    name: dbForm.name,
    slug: dbForm.slug,
    description: dbForm.description,
    schema: dbForm.schema as FormSchema,
    status: dbForm.status as FormStatus,
    submitButtonText: dbForm.submitButtonText,
    successMessage: dbForm.successMessage,
    successRedirectUrl: dbForm.successRedirectUrl,
    paymentEnabled: dbForm.paymentEnabled,
    paymentAmount: dbForm.paymentAmount ? Number(dbForm.paymentAmount) : null,
    paymentCurrency: dbForm.paymentCurrency,
    paymentDescription: dbForm.paymentDescription,
    styling: dbForm.styling,
    totalSubmissions: dbForm.totalSubmissions,
    successfulPayments: dbForm.successfulPayments,
    totalRevenue: Number(dbForm.totalRevenue || 0),
    siteId: dbForm.siteId,
    funnelId: dbForm.funnelId,
    pageId: dbForm.pageId,
    createdAt: dbForm.createdAt,
    updatedAt: dbForm.updatedAt,
    createdBy: dbForm.createdBy,
    updatedBy: dbForm.updatedBy,
    isDemo: dbForm.isDemo
  }
}

export async function createForm(input: CreateFormInput): Promise<{ success: boolean; form?: Form; error?: string }> {
  try {
    const existingSlug = await prisma.sf_forms.findFirst({
      where: { tenantId: input.tenantId, slug: input.slug }
    })
    
    if (existingSlug) {
      return { success: false, error: 'A form with this slug already exists' }
    }

    const dbForm = await prisma.sf_forms.create({
      data: {
        tenantId: input.tenantId,
        partnerId: input.partnerId,
        platformInstanceId: input.platformInstanceId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        schema: input.schema as any,
        status: sf_FormStatus.DRAFT,
        submitButtonText: input.submitButtonText || 'Submit',
        successMessage: input.successMessage,
        successRedirectUrl: input.successRedirectUrl,
        paymentEnabled: input.paymentEnabled || false,
        paymentAmount: input.paymentAmount,
        paymentCurrency: input.paymentCurrency || 'NGN',
        paymentDescription: input.paymentDescription,
        styling: input.styling as any,
        siteId: input.siteId,
        funnelId: input.funnelId,
        pageId: input.pageId,
        createdBy: input.createdBy,
        isDemo: input.isDemo || false
      }
    })

    return { success: true, form: mapDbFormToForm(dbForm) }
  } catch (error: any) {
    console.error('createForm error:', error)
    return { success: false, error: error.message || 'Failed to create form' }
  }
}

export async function getForm(formId: string, tenantId: string): Promise<Form | null> {
  const dbForm = await prisma.sf_forms.findFirst({
    where: { id: formId, tenantId }
  })
  
  return dbForm ? mapDbFormToForm(dbForm) : null
}

export async function getFormBySlug(slug: string, tenantId: string): Promise<Form | null> {
  const dbForm = await prisma.sf_forms.findFirst({
    where: { slug, tenantId }
  })
  
  return dbForm ? mapDbFormToForm(dbForm) : null
}

export async function getPublicForm(formId: string): Promise<Form | null> {
  const dbForm = await prisma.sf_forms.findFirst({
    where: { 
      id: formId,
      status: sf_FormStatus.ACTIVE
    }
  })
  
  return dbForm ? mapDbFormToForm(dbForm) : null
}

export async function listForms(
  tenantId: string,
  options: ListFormsOptions = {}
): Promise<{ forms: Form[]; total: number; page: number; limit: number }> {
  const {
    status,
    partnerId,
    siteId,
    funnelId,
    search,
    includeDemo = false,
    page = 1,
    limit = 20
  } = options

  const where: any = { tenantId }
  
  if (status) {
    where.status = status as sf_FormStatus
  }
  if (partnerId) {
    where.partnerId = partnerId
  }
  if (siteId) {
    where.siteId = siteId
  }
  if (funnelId) {
    where.funnelId = funnelId
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ]
  }
  if (!includeDemo) {
    where.isDemo = false
  }

  const [dbForms, total] = await Promise.all([
    prisma.sf_forms.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.sf_forms.count({ where })
  ])

  return {
    forms: dbForms.map(mapDbFormToForm),
    total,
    page,
    limit
  }
}

export async function updateForm(
  formId: string,
  tenantId: string,
  input: UpdateFormInput
): Promise<{ success: boolean; form?: Form; error?: string }> {
  try {
    const existing = await prisma.sf_forms.findFirst({
      where: { id: formId, tenantId }
    })
    
    if (!existing) {
      return { success: false, error: 'Form not found' }
    }

    const updateData: any = {
      updatedBy: input.updatedBy
    }

    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.schema !== undefined) updateData.schema = input.schema as any
    if (input.status !== undefined) updateData.status = input.status as sf_FormStatus
    if (input.submitButtonText !== undefined) updateData.submitButtonText = input.submitButtonText
    if (input.successMessage !== undefined) updateData.successMessage = input.successMessage
    if (input.successRedirectUrl !== undefined) updateData.successRedirectUrl = input.successRedirectUrl
    if (input.paymentEnabled !== undefined) updateData.paymentEnabled = input.paymentEnabled
    if (input.paymentAmount !== undefined) updateData.paymentAmount = input.paymentAmount
    if (input.paymentCurrency !== undefined) updateData.paymentCurrency = input.paymentCurrency
    if (input.paymentDescription !== undefined) updateData.paymentDescription = input.paymentDescription
    if (input.styling !== undefined) updateData.styling = input.styling as any
    if (input.siteId !== undefined) updateData.siteId = input.siteId
    if (input.funnelId !== undefined) updateData.funnelId = input.funnelId
    if (input.pageId !== undefined) updateData.pageId = input.pageId

    const dbForm = await prisma.sf_forms.update({
      where: { id: formId },
      data: updateData
    })

    return { success: true, form: mapDbFormToForm(dbForm) }
  } catch (error: any) {
    console.error('updateForm error:', error)
    return { success: false, error: error.message || 'Failed to update form' }
  }
}

export async function deleteForm(
  formId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await prisma.sf_forms.findFirst({
      where: { id: formId, tenantId }
    })
    
    if (!existing) {
      return { success: false, error: 'Form not found' }
    }

    await prisma.sf_forms.delete({
      where: { id: formId }
    })

    return { success: true }
  } catch (error: any) {
    console.error('deleteForm error:', error)
    return { success: false, error: error.message || 'Failed to delete form' }
  }
}

export async function activateForm(
  formId: string,
  tenantId: string,
  userId: string
): Promise<{ success: boolean; form?: Form; error?: string }> {
  return updateForm(formId, tenantId, { status: 'ACTIVE', updatedBy: userId })
}

export async function pauseForm(
  formId: string,
  tenantId: string,
  userId: string
): Promise<{ success: boolean; form?: Form; error?: string }> {
  return updateForm(formId, tenantId, { status: 'PAUSED', updatedBy: userId })
}

export async function archiveForm(
  formId: string,
  tenantId: string,
  userId: string
): Promise<{ success: boolean; form?: Form; error?: string }> {
  return updateForm(formId, tenantId, { status: 'ARCHIVED', updatedBy: userId })
}

export async function incrementSubmissionCount(
  formId: string,
  includePayment: boolean = false,
  paymentAmount: number = 0
): Promise<void> {
  const incrementData: any = {
    totalSubmissions: { increment: 1 }
  }
  
  if (includePayment) {
    incrementData.successfulPayments = { increment: 1 }
    incrementData.totalRevenue = { increment: paymentAmount }
  }

  await prisma.sf_forms.update({
    where: { id: formId },
    data: incrementData
  })
}
