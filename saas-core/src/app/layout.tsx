import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { getTenantBranding, generateBrandingCSS } from "@/lib/branding"

const inter = Inter({ subsets: ["latin"] })

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getTenantBranding()
  
  return {
    title: branding.appName,
    description: `${branding.appName} - Multi-Tenant SaaS Platform`,
    manifest: `/manifest.json?tenant=${branding.slug}`,
    icons: {
      icon: branding.faviconUrl || '/favicon.ico',
      apple: branding.faviconUrl || '/icons/icon-192.png'
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
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
