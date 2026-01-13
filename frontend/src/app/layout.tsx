import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { getTenantBranding, generateBrandingCSS } from "@/lib/branding"
import { PWAProvider } from "@/components/PWAProvider"

export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ["latin"] })

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getTenantBranding()
  
  return {
    title: branding.appName,
    description: `${branding.appName} - WebWaka Platform`,
    manifest: `/manifest.json?tenant=${branding.slug}`,
    icons: {
      icon: branding.faviconUrl || '/favicon.ico',
      apple: branding.faviconUrl || `/api/icons/icon-192?tenant=${branding.slug}`
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: branding.appName
    }
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#6366f1'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const branding = await getTenantBranding()
  const brandingCSS = generateBrandingCSS(branding)
  
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandingCSS }} />
        <meta name="theme-color" content={branding.primaryColor} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href={`/api/icons/icon-192?tenant=${branding.slug}`} />
      </head>
      <body className={inter.className}>
        <PWAProvider>
          {children}
        </PWAProvider>
      </body>
    </html>
  )
}
