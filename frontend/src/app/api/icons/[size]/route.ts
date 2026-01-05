import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantFromQuery } from '@/lib/tenant-resolver'

type RouteParams = {
  params: Promise<{ size: string }>
}

/**
 * Dynamic Icon Generator per Tenant
 * Generates SVG icons with tenant's primary color
 * 
 * URL: /api/icons/icon-{size}?tenant={slug}
 * Sizes: 72, 96, 128, 144, 152, 192, 384, 512
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { size: sizeParam } = await params
    const { searchParams } = new URL(request.url)
    const tenantSlug = searchParams.get('tenant')
    
    // Parse size from param (e.g., "icon-192" -> 192)
    const size = parseInt(sizeParam.replace('icon-', ''))
    if (isNaN(size) || size < 16 || size > 1024) {
      return NextResponse.json({ error: 'Invalid size' }, { status: 400 })
    }
    
    // Default colors
    let primaryColor = '#6366f1'
    let secondaryColor = '#8b5cf6'
    let initial = 'S'
    
    // Resolve tenant for branding
    if (tenantSlug) {
      const context = await resolveTenantFromQuery(tenantSlug)
      if (context) {
        primaryColor = context.tenant.primaryColor
        secondaryColor = context.tenant.secondaryColor
        initial = context.tenant.appName.charAt(0).toUpperCase()
      }
    }
    
    // Generate SVG icon with tenant branding
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
        <text 
          x="50%" 
          y="50%" 
          dominant-baseline="central" 
          text-anchor="middle" 
          font-family="system-ui, -apple-system, sans-serif" 
          font-weight="bold" 
          font-size="${size * 0.5}" 
          fill="white"
        >${initial}</text>
      </svg>
    `.trim()
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Vary': 'Accept'
      }
    })
  } catch (error) {
    console.error('Failed to generate icon:', error)
    
    // Return a simple fallback icon
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
        <rect width="192" height="192" rx="38" fill="#6366f1"/>
        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="96" fill="white">S</text>
      </svg>
    `.trim()
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache'
      }
    })
  }
}
