export const dynamic = 'force-dynamic'

/**
 * SITES & FUNNELS: Forms API - Phase E1.3
 * 
 * REST API for schema-driven form management
 * Supports forms with optional payment integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { requireSitesFunnelsEnabled, requirePartnerOwnership } from '@/lib/sites-funnels/entitlements-service'
import {
  createForm,
  getForm,
  getFormBySlug,
  getPublicForm,
  listForms,
  updateForm,
  deleteForm,
  activateForm,
  pauseForm,
  archiveForm
} from '@/lib/sites-funnels/forms'
import { validateFormStatus } from './validators'

export async function GET(request: NextRequest) {
  const session = await getCurrentSession()
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'list'
  const tenantId = searchParams.get('tenantId') || session.activeTenantId

  if (!tenantId) {
    return NextResponse.json({ 
      success: false, 
      error: 'No active tenant. Please select a tenant to manage forms.',
      code: 'NO_TENANT'
    }, { status: 400 })
  }

  const entitlementCheck = await requireSitesFunnelsEnabled(tenantId)
  if (!entitlementCheck.authorized) {
    return NextResponse.json({ success: false, error: entitlementCheck.error }, { status: 403 })
  }

  try {
    switch (action) {
      case 'list': {
        const status = validateFormStatus(searchParams.get('status'))
        const partnerId = searchParams.get('partnerId') || undefined
        const siteId = searchParams.get('siteId') || undefined
        const funnelId = searchParams.get('funnelId') || undefined
        const search = searchParams.get('search') || undefined
        const includeDemo = searchParams.get('includeDemo') === 'true'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        const result = await listForms(tenantId, {
          status: status || undefined,
          partnerId,
          siteId,
          funnelId,
          search,
          includeDemo,
          page,
          limit
        })
        return NextResponse.json({ success: true, ...result })
      }

      case 'get': {
        const formId = searchParams.get('formId')
        if (!formId) {
          return NextResponse.json({ success: false, error: 'Form ID required' }, { status: 400 })
        }
        const form = await getForm(formId, tenantId)
        if (!form) {
          return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 })
        }
        return NextResponse.json({ success: true, form })
      }

      case 'get-by-slug': {
        const slug = searchParams.get('slug')
        if (!slug) {
          return NextResponse.json({ success: false, error: 'Slug required' }, { status: 400 })
        }
        const form = await getFormBySlug(slug, tenantId)
        if (!form) {
          return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 })
        }
        return NextResponse.json({ success: true, form })
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Forms API GET error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession()
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const body = await request.json()
    const { action, tenantId: bodyTenantId } = body
    const tenantId = bodyTenantId || session.activeTenantId

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 })
    }

    const entitlementCheck = await requireSitesFunnelsEnabled(tenantId)
    if (!entitlementCheck.authorized) {
      return NextResponse.json({ success: false, error: entitlementCheck.error }, { status: 403 })
    }

    const partnerCheck = await requirePartnerOwnership(tenantId, userId)
    if (!partnerCheck.authorized) {
      return NextResponse.json({ success: false, error: partnerCheck.error }, { status: 403 })
    }

    switch (action) {
      case 'create': {
        const { name, slug, description, schema, ...settings } = body
        
        if (!name || !slug || !schema) {
          return NextResponse.json({ 
            success: false, 
            error: 'Name, slug, and schema are required' 
          }, { status: 400 })
        }

        if (!schema.fields || !Array.isArray(schema.fields)) {
          return NextResponse.json({ 
            success: false, 
            error: 'Schema must contain a fields array' 
          }, { status: 400 })
        }

        const result = await createForm({
          tenantId,
          partnerId: partnerCheck.partnerId!,
          platformInstanceId: settings.platformInstanceId,
          name,
          slug,
          description,
          schema,
          submitButtonText: settings.submitButtonText,
          successMessage: settings.successMessage,
          successRedirectUrl: settings.successRedirectUrl,
          paymentEnabled: settings.paymentEnabled,
          paymentAmount: settings.paymentAmount,
          paymentCurrency: settings.paymentCurrency,
          paymentDescription: settings.paymentDescription,
          styling: settings.styling,
          siteId: settings.siteId,
          funnelId: settings.funnelId,
          pageId: settings.pageId,
          createdBy: userId,
          isDemo: settings.isDemo
        })
        return NextResponse.json(result)
      }

      case 'update': {
        const { formId, ...updateData } = body
        if (!formId) {
          return NextResponse.json({ success: false, error: 'Form ID required' }, { status: 400 })
        }
        const result = await updateForm(formId, tenantId, {
          ...updateData,
          updatedBy: userId
        })
        return NextResponse.json(result)
      }

      case 'delete': {
        const { formId } = body
        if (!formId) {
          return NextResponse.json({ success: false, error: 'Form ID required' }, { status: 400 })
        }
        const result = await deleteForm(formId, tenantId)
        return NextResponse.json(result)
      }

      case 'activate': {
        const { formId } = body
        if (!formId) {
          return NextResponse.json({ success: false, error: 'Form ID required' }, { status: 400 })
        }
        const result = await activateForm(formId, tenantId, userId)
        return NextResponse.json(result)
      }

      case 'pause': {
        const { formId } = body
        if (!formId) {
          return NextResponse.json({ success: false, error: 'Form ID required' }, { status: 400 })
        }
        const result = await pauseForm(formId, tenantId, userId)
        return NextResponse.json(result)
      }

      case 'archive': {
        const { formId } = body
        if (!formId) {
          return NextResponse.json({ success: false, error: 'Form ID required' }, { status: 400 })
        }
        const result = await archiveForm(formId, tenantId, userId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Forms API POST error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
