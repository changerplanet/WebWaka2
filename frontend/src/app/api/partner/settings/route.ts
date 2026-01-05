/**
 * Partner Settings API
 * 
 * GET: Retrieve partner settings
 * PUT: Update partner settings
 * 
 * Settings are stored in the Partner record metadata field.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePartnerUser } from '@/lib/partner-authorization'

interface PartnerMetadata {
  contactName?: string
  contactPhone?: string
  defaultPrimaryColor?: string
  defaultSecondaryColor?: string
  defaultLogoUrl?: string
  supportEmail?: string
  supportPhone?: string
  supportWhatsApp?: string
  emailNotifications?: boolean
  smsNotifications?: boolean
  newClientAlerts?: boolean
  renewalReminders?: boolean
  wholesalePlan?: string
  wholesalePlanDetails?: string
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePartnerUser()
    
    if (!authResult.authorized || !authResult.partner) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const partner = authResult.partner
    const metadata = (partner.metadata as PartnerMetadata) || {}
    
    // Return partner settings from core fields + metadata
    const settings = {
      businessName: partner.name || '',
      contactName: metadata.contactName || '',
      contactEmail: partner.email || '',
      contactPhone: partner.phone || '',
      defaultPrimaryColor: metadata.defaultPrimaryColor || '#10B981',
      defaultSecondaryColor: metadata.defaultSecondaryColor || '#059669',
      defaultLogoUrl: metadata.defaultLogoUrl || '',
      supportEmail: metadata.supportEmail || partner.email || '',
      supportPhone: metadata.supportPhone || partner.phone || '',
      supportWhatsApp: metadata.supportWhatsApp || '',
      emailNotifications: metadata.emailNotifications ?? true,
      smsNotifications: metadata.smsNotifications ?? false,
      newClientAlerts: metadata.newClientAlerts ?? true,
      renewalReminders: metadata.renewalReminders ?? true,
      wholesalePlan: metadata.wholesalePlan || 'Standard Partner',
      wholesalePlanDetails: metadata.wholesalePlanDetails || 'Access to all suites and capabilities with standard wholesale pricing.',
    }
    
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching partner settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requirePartnerUser()
    
    if (!authResult.authorized || !authResult.partner) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const partner = authResult.partner
    const existingMetadata = (partner.metadata as PartnerMetadata) || {}
    
    // Build updated metadata (settings stored in metadata JSON field)
    const updatedMetadata: PartnerMetadata = {
      ...existingMetadata,
      contactName: body.contactName,
      defaultPrimaryColor: body.defaultPrimaryColor,
      defaultSecondaryColor: body.defaultSecondaryColor,
      defaultLogoUrl: body.defaultLogoUrl,
      supportEmail: body.supportEmail,
      supportPhone: body.supportPhone,
      supportWhatsApp: body.supportWhatsApp,
      emailNotifications: body.emailNotifications,
      smsNotifications: body.smsNotifications,
      newClientAlerts: body.newClientAlerts,
      renewalReminders: body.renewalReminders,
    }
    
    // Update partner record (name goes to core field, rest to metadata)
    await prisma.partner.update({
      where: { id: partner.id },
      data: {
        name: body.businessName || partner.name,
        phone: body.contactPhone || partner.phone,
        metadata: JSON.parse(JSON.stringify(updatedMetadata)),
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating partner settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
