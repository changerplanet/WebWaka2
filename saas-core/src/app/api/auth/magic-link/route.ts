import { NextRequest, NextResponse } from 'next/server'
import { createMagicLink } from '@/lib/auth'
import { resend, EMAIL_FROM } from '@/lib/resend'
import { resolveTenantBySlug } from '@/lib/tenant-resolver'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, tenantSlug } = body
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    // Resolve tenant if slug provided
    let tenantId: string | undefined
    let tenantName = 'SaaS Core'
    
    if (tenantSlug) {
      const tenant = await resolveTenantBySlug(tenantSlug)
      if (tenant) {
        tenantId = tenant.id
        tenantName = tenant.appName || tenant.name
      }
    }
    
    // Create magic link
    const { token, user } = await createMagicLink(email, tenantId)
    
    // Build verification URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verifyUrl = `${appUrl}/api/auth/verify?token=${token}`
    
    // Send email via Resend
    if (resend) {
      const { error: emailError } = await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: `Sign in to ${tenantName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">${tenantName}</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1f2937; margin-top: 0;">Sign in to your account</h2>
              <p style="color: #6b7280;">Click the button below to securely sign in. This link will expire in 15 minutes.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Sign In</a>
              </div>
              <p style="color: #9ca3af; font-size: 14px;">If you didn't request this email, you can safely ignore it.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">Or copy and paste this URL into your browser:</p>
              <p style="color: #6366f1; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
            </div>
          </body>
          </html>
        `
      })
      
      if (emailError) {
        console.error('Failed to send email:', emailError)
        return NextResponse.json(
          { success: false, error: 'Failed to send email. Please try again.' },
          { status: 500 }
        )
      }
    } else {
      // Development: log the magic link
      console.log('\n=========================================')
      console.log('MAGIC LINK (Resend not configured):')
      console.log(verifyUrl)
      console.log('=========================================\n')
    }
    
    return NextResponse.json({
      success: true,
      message: 'Magic link sent! Check your email.'
    })
    
  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create magic link' },
      { status: 500 }
    )
  }
}
