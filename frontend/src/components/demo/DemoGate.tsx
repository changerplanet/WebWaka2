'use client'

/**
 * DEMO ACCESS GATE
 * Wave C3: Restricts demo pages to authorized users only
 * 
 * This component checks if the user should have access to demo pages.
 * Access is granted if:
 * 1. User is authenticated as Super Admin
 * 2. User is in a demo tenant context
 * 3. User has explicit demo access role
 * 
 * @module components/demo/DemoGate
 */

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Shield, AlertTriangle } from 'lucide-react'

interface DemoGateProps {
  children: ReactNode
  fallbackUrl?: string
}

interface AccessCheckResult {
  allowed: boolean
  reason?: string
  userRole?: string
}

export function DemoGate({ children, fallbackUrl = '/' }: DemoGateProps) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [accessResult, setAccessResult] = useState<AccessCheckResult | null>(null)

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch('/api/auth/session')
        
        if (!response.ok) {
          setAccessResult({ 
            allowed: false, 
            reason: 'Authentication required to access demo pages' 
          })
          return
        }

        const session = await response.json()

        if (!session || !session.user) {
          setAccessResult({ 
            allowed: false, 
            reason: 'Authentication required to access demo pages' 
          })
          return
        }

        if (session.user.globalRole === 'SUPER_ADMIN') {
          setAccessResult({ 
            allowed: true, 
            userRole: 'Super Admin' 
          })
          return
        }

        if (session.user.globalRole === 'PARTNER_OWNER' || 
            session.user.globalRole === 'PARTNER_ADMIN' ||
            session.user.globalRole === 'PARTNER_MEMBER') {
          setAccessResult({ 
            allowed: true, 
            userRole: 'Partner' 
          })
          return
        }

        if (session.tenant && session.tenant.slug) {
          const slug = session.tenant.slug.toLowerCase()
          const isDemoTenant = slug === 'demo' || 
                               slug.startsWith('demo-') || 
                               slug.startsWith('demo_')
          
          if (isDemoTenant) {
            setAccessResult({ 
              allowed: true, 
              userRole: 'Demo Tenant User' 
            })
            return
          }
        }

        setAccessResult({ 
          allowed: false, 
          reason: 'Demo pages are restricted to demo tenants and platform administrators' 
        })

      } catch (error) {
        console.error('Demo access check failed:', error)
        setAccessResult({ 
          allowed: false, 
          reason: 'Unable to verify access permissions' 
        })
      } finally {
        setChecking(false)
      }
    }

    checkAccess()
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-3 text-slate-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!accessResult?.allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-slate-600 mb-6">{accessResult?.reason}</p>
          <button
            onClick={() => router.push(fallbackUrl)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {accessResult?.userRole && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-1 text-sm z-50">
          <Shield className="w-4 h-4 inline-block mr-1" />
          Demo Mode - Viewing as {accessResult.userRole}
        </div>
      )}
      <div className={accessResult?.userRole ? 'pt-8' : ''}>
        {children}
      </div>
    </>
  )
}
