/**
 * HOSPITALITY SUITE: Guests API
 * 
 * GET - List guests, get guest by ID/number/phone, get history
 * POST - Create guest, merge guests
 * PATCH - Update guest, set VIP status
 * 
 * @module api/hospitality/guests
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as GuestService from '@/lib/hospitality/services/guest-service'

// ============================================================================
// GET - List guests or get by ID
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_guests')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const guestNumber = searchParams.get('guestNumber')
    const phone = searchParams.get('phone')
    const action = searchParams.get('action')

    // Get guest by ID
    if (id) {
      if (action === 'history') {
        const history = await GuestService.getGuestHistory(tenantId, id)
        return NextResponse.json({ success: true, history })
      }

      const guest = await GuestService.getGuest(tenantId, id)
      if (!guest) {
        return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, guest })
    }

    // Get guest by number
    if (guestNumber) {
      const guest = await GuestService.getGuestByNumber(tenantId, guestNumber)
      if (!guest) {
        return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, guest })
    }

    // Get guest by phone
    if (phone) {
      const guest = await GuestService.getGuestByPhone(tenantId, phone)
      if (!guest) {
        return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, guest })
    }

    // List guests
    const search = searchParams.get('search') || undefined
    const isVip = searchParams.get('isVip') === 'true' ? true : searchParams.get('isVip') === 'false' ? false : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await GuestService.listGuests(tenantId, {
      search,
      isVip,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Guests GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create guest or merge guests
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_guests')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Handle merge action
    if (body.action === 'merge') {
      if (!body.primaryGuestId || !body.secondaryGuestId) {
        return NextResponse.json({ error: 'primaryGuestId and secondaryGuestId are required' }, { status: 400 })
      }

      const guest = await GuestService.mergeGuests(tenantId, body.primaryGuestId, body.secondaryGuestId)
      return NextResponse.json({ success: true, guest, message: 'Guests merged successfully' })
    }

    // Create guest
    if (!body.firstName || !body.lastName) {
      return NextResponse.json({ error: 'firstName and lastName are required' }, { status: 400 })
    }

    const guest = await GuestService.createGuest({
      tenantId,
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      title: body.title,
      phone: body.phone,
      email: body.email,
      nationalId: body.nationalId,
      idType: body.idType,
      idNumber: body.idNumber,
      nationality: body.nationality,
      address: body.address,
      preferences: body.preferences,
      notes: body.notes,
      isVip: body.isVip,
      vipNotes: body.vipNotes,
    })

    return NextResponse.json({ success: true, guest })
  } catch (error) {
    console.error('Guests POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update guest or set VIP status
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_guests')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Guest ID is required' }, { status: 400 })
    }

    // Handle VIP status update
    if (body.action === 'setVip') {
      const guest = await GuestService.setVipStatus(tenantId, body.id, body.isVip, body.vipNotes)
      return NextResponse.json({ success: true, guest })
    }

    // Update guest
    const guest = await GuestService.updateGuest(tenantId, body.id, {
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      title: body.title,
      phone: body.phone,
      email: body.email,
      nationalId: body.nationalId,
      idType: body.idType,
      idNumber: body.idNumber,
      nationality: body.nationality,
      address: body.address,
      preferences: body.preferences,
      notes: body.notes,
      isVip: body.isVip,
      vipNotes: body.vipNotes,
    })

    return NextResponse.json({ success: true, guest })
  } catch (error) {
    console.error('Guests PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
