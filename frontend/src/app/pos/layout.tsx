'use client'

import { ReactNode, useEffect, useState, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { Loader2, AlertCircle, Building2, ShoppingCart, ShieldAlert } from 'lucide-react'

export type POSRole = 'POS_CASHIER' | 'POS_SUPERVISOR' | 'POS_MANAGER'

interface POSRoleContextType {
  posRole: POSRole
  hasPermission: (permission: string) => boolean
}

const POSRoleContext = createContext<POSRoleContextType | null>(null)

export function usePOSRole() {
  const context = useContext(POSRoleContext)
  if (!context) {
    throw new Error('usePOSRole must be used within POSLayout')
  }
  return context
}

export function getPOSRole(tenantRole: string): POSRole {
  if (tenantRole === 'TENANT_ADMIN') {
    return 'POS_MANAGER'
  }
  const storedRole = typeof window !== 'undefined' 
    ? localStorage.getItem('webwaka_pos_role') 
    : null
  if (storedRole && ['POS_CASHIER', 'POS_SUPERVISOR', 'POS_MANAGER'].includes(storedRole)) {
    return storedRole as POSRole
  }
  return 'POS_CASHIER'
}

export function hasPOSPermission(role: POSRole, permission: string): boolean {
  const permissions: Record<POSRole, string[]> = {
    POS_CASHIER: [
      'pos.sale.create', 'pos.sale.add_item', 'pos.sale.remove_item',
      'pos.sale.complete', 'pos.payment.cash', 'pos.payment.card',
      'pos.payment.transfer', 'pos.discount.apply_preset'
    ],
    POS_SUPERVISOR: [
      'pos.sale.create', 'pos.sale.add_item', 'pos.sale.remove_item',
      'pos.sale.complete', 'pos.sale.void', 'pos.payment.cash', 
      'pos.payment.card', 'pos.payment.transfer', 'pos.payment.split',
      'pos.discount.apply_preset', 'pos.discount.apply_custom',
      'pos.refund.create', 'pos.report.all_sales'
    ],
    POS_MANAGER: [
      'pos.sale.create', 'pos.sale.add_item', 'pos.sale.remove_item',
      'pos.sale.complete', 'pos.sale.void', 'pos.sale.void_others',
      'pos.payment.cash', 'pos.payment.card', 'pos.payment.transfer',
      'pos.payment.split', 'pos.discount.apply_preset', 
      'pos.discount.apply_custom', 'pos.discount.override_max',
      'pos.refund.create', 'pos.refund.without_receipt', 'pos.refund.approve',
      'pos.report.all_sales', 'pos.report.staff', 'pos.report.export',
      'pos.settings.view', 'pos.settings.edit'
    ]
  }
  return permissions[role]?.includes(permission) ?? false
}

function POSContent({ children }: { children: ReactNode }) {
  const { user, activeTenantId, activeTenant, isLoading, isAuthenticated, switchTenant } = useAuth()
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)
  const [posRole, setPosRole] = useState<POSRole>('POS_CASHIER')

  useEffect(() => {
    async function init() {
      if (isLoading) return

      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      if (!activeTenantId && user && user.memberships.length > 0) {
        if (user.memberships.length === 1) {
          await switchTenant(user.memberships[0].tenantId)
        } else {
          router.push('/select-tenant?redirect=/pos')
          return
        }
      }

      if (activeTenant) {
        const role = getPOSRole(activeTenant.role)
        setPosRole(role)
      }

      setIsInitializing(false)
    }

    init()
  }, [isLoading, isAuthenticated, activeTenantId, activeTenant, user, router, switchTenant])
  
  const roleContextValue: POSRoleContextType = {
    posRole,
    hasPermission: (permission: string) => hasPOSPermission(posRole, permission)
  }

  // Loading state
  if (isLoading || isInitializing) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading POS...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    )
  }

  // No tenant selected but user has memberships
  if (!activeTenantId && user && user.memberships.length > 0) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <ShoppingCart className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 text-center mb-4">Select a Business</h2>
          <p className="text-gray-600 text-center mb-6">
            Choose which business to open in POS
          </p>
          <div className="space-y-2">
            {user.memberships.map(membership => (
              <button
                key={membership.tenantId}
                onClick={() => switchTenant(membership.tenantId)}
                className="w-full p-4 text-left rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <p className="font-medium text-gray-900">{membership.tenantName}</p>
                <p className="text-sm text-gray-500">{membership.role}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // No memberships at all
  if (!activeTenantId && (!user || user.memberships.length === 0)) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-4">No Business Access</h2>
          <p className="text-gray-600 mb-6">
            You don&apos;t have access to any businesses yet. Contact your administrator to get POS access.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <POSRoleContext.Provider value={roleContextValue}>
      {children}
    </POSRoleContext.Provider>
  )
}

export default function POSLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AuthProvider>
      <POSContent>
        {children}
      </POSContent>
    </AuthProvider>
  )
}
