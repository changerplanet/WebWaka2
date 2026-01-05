'use client'

/**
 * INSTANCE BRANDING PREVIEW (Phase 2.1)
 * 
 * Visual preview of instance branding with source indicators.
 * Shows which values come from instance vs tenant fallback.
 * 
 * PHASE 2 BOUNDARIES:
 * - Simple preview only
 * - No advanced theme editors
 * - Source tracking (instance vs tenant)
 */

import { Eye, Building2, Layers, Check } from 'lucide-react'

interface BrandingValue {
  value: string | null
  source: 'instance' | 'tenant' | 'default'
}

interface InstanceBrandingPreviewProps {
  instanceBranding: {
    displayName: string | null
    logoUrl: string | null
    faviconUrl: string | null
    primaryColor: string | null
    secondaryColor: string | null
  }
  tenantBranding: {
    appName: string
    logoUrl: string | null
    faviconUrl: string | null
    primaryColor: string
    secondaryColor: string
  }
  instanceName: string
  className?: string
}

export function InstanceBrandingPreview({
  instanceBranding,
  tenantBranding,
  instanceName,
  className = ''
}: InstanceBrandingPreviewProps) {
  // Resolve each branding value with source tracking
  const resolved = {
    displayName: {
      value: instanceBranding.displayName || tenantBranding.appName,
      source: instanceBranding.displayName ? 'instance' : 'tenant'
    },
    logoUrl: {
      value: instanceBranding.logoUrl || tenantBranding.logoUrl,
      source: instanceBranding.logoUrl ? 'instance' : (tenantBranding.logoUrl ? 'tenant' : 'default')
    },
    faviconUrl: {
      value: instanceBranding.faviconUrl || tenantBranding.faviconUrl,
      source: instanceBranding.faviconUrl ? 'instance' : (tenantBranding.faviconUrl ? 'tenant' : 'default')
    },
    primaryColor: {
      value: instanceBranding.primaryColor || tenantBranding.primaryColor,
      source: instanceBranding.primaryColor ? 'instance' : 'tenant'
    },
    secondaryColor: {
      value: instanceBranding.secondaryColor || tenantBranding.secondaryColor,
      source: instanceBranding.secondaryColor ? 'instance' : 'tenant'
    }
  } as Record<string, BrandingValue>

  const SourceBadge = ({ source }: { source: 'instance' | 'tenant' | 'default' }) => {
    const styles = {
      instance: 'bg-green-100 text-green-700',
      tenant: 'bg-blue-100 text-blue-700',
      default: 'bg-slate-100 text-slate-500'
    }
    const icons = {
      instance: Layers,
      tenant: Building2,
      default: null
    }
    const Icon = icons[source]
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[source]}`}>
        {Icon && <Icon className="w-3 h-3" />}
        {source === 'instance' ? 'Instance' : source === 'tenant' ? 'Tenant' : 'Default'}
      </span>
    )
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 ${className}`} data-testid="instance-branding-preview">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-slate-500" />
          <h3 className="font-semibold text-slate-900">Branding Preview</h3>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          How "{instanceName}" will appear to users
        </p>
      </div>

      {/* Preview Area */}
      <div className="p-6">
        {/* Mini Dashboard Preview */}
        <div className="rounded-lg overflow-hidden border border-slate-200 mb-6">
          <div className="flex">
            {/* Mini Sidebar */}
            <div 
              className="w-20 h-48 flex flex-col items-center py-4 gap-3"
              style={{ 
                background: `linear-gradient(135deg, ${resolved.primaryColor.value}, ${resolved.secondaryColor.value})` 
              }}
            >
              {/* Logo/Initial */}
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                {resolved.logoUrl.value ? (
                  <img 
                    src={resolved.logoUrl.value} 
                    alt="Logo" 
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {(resolved.displayName.value as string)?.charAt(0) || 'W'}
                  </span>
                )}
              </div>
              
              {/* Nav items */}
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-white/20" />
                <div className="w-8 h-8 rounded-lg bg-white/10" />
                <div className="w-8 h-8 rounded-lg bg-white/10" />
              </div>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 p-4 bg-slate-50">
              <h4 className="font-semibold text-slate-900 mb-1">
                {resolved.displayName.value}
              </h4>
              <p className="text-sm text-slate-500 mb-4">Dashboard</p>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-2">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white p-3 rounded-lg">
                    <div 
                      className="w-6 h-6 rounded mb-2"
                      style={{ backgroundColor: `${resolved.primaryColor.value}20` }}
                    />
                    <div className="h-2 bg-slate-200 rounded w-16 mb-1" />
                    <div className="h-2 bg-slate-100 rounded w-10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Branding Values Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-600">Property</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Value</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 text-slate-700">Display Name</td>
                <td className="px-4 py-3 text-slate-900 font-medium">{resolved.displayName.value}</td>
                <td className="px-4 py-3"><SourceBadge source={resolved.displayName.source as any} /></td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700">Primary Color</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border border-slate-200"
                      style={{ backgroundColor: resolved.primaryColor.value as string }}
                    />
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {resolved.primaryColor.value}
                    </code>
                  </div>
                </td>
                <td className="px-4 py-3"><SourceBadge source={resolved.primaryColor.source as any} /></td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700">Secondary Color</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border border-slate-200"
                      style={{ backgroundColor: resolved.secondaryColor.value as string }}
                    />
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {resolved.secondaryColor.value}
                    </code>
                  </div>
                </td>
                <td className="px-4 py-3"><SourceBadge source={resolved.secondaryColor.source as any} /></td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700">Logo</td>
                <td className="px-4 py-3">
                  {resolved.logoUrl.value ? (
                    <img 
                      src={resolved.logoUrl.value} 
                      alt="Logo" 
                      className="w-8 h-8 object-contain rounded"
                    />
                  ) : (
                    <span className="text-slate-400 text-xs">Not set</span>
                  )}
                </td>
                <td className="px-4 py-3"><SourceBadge source={resolved.logoUrl.source as any} /></td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700">Favicon</td>
                <td className="px-4 py-3">
                  {resolved.faviconUrl.value ? (
                    <img 
                      src={resolved.faviconUrl.value} 
                      alt="Favicon" 
                      className="w-4 h-4 object-contain"
                    />
                  ) : (
                    <span className="text-slate-400 text-xs">Not set</span>
                  )}
                </td>
                <td className="px-4 py-3"><SourceBadge source={resolved.faviconUrl.source as any} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-green-600" />
            <span>Instance override</span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-blue-600" />
            <span>Tenant fallback</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-slate-200 rounded-full" />
            <span>Platform default</span>
          </div>
        </div>
      </div>
    </div>
  )
}
