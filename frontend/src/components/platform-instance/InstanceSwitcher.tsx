'use client'

/**
 * INSTANCE SWITCHER (Phase 2.1)
 * 
 * Dropdown component for switching between platform instances.
 * Only shown when tenant has 2+ instances.
 * 
 * PHASE 2 BOUNDARIES:
 * - Visibility only, not permissions
 * - Single login session maintained
 * - No re-auth required
 */

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Layers, Building2 } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

interface InstanceSwitcherProps {
  className?: string
}

export function InstanceSwitcher({ className = '' }: InstanceSwitcherProps) {
  const { activeInstance, availableInstances, switchInstance, activeTenant } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Don't show if only one instance or no instances
  if (!availableInstances || availableInstances.length <= 1) {
    return null
  }

  const handleSwitch = async (instanceId: string) => {
    if (instanceId === activeInstance?.id) {
      setIsOpen(false)
      return
    }
    
    const success = await switchInstance(instanceId)
    if (success) {
      setIsOpen(false)
      // Optional: Could trigger a page refresh or state update
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm"
        data-testid="instance-switcher-trigger"
      >
        <Layers className="w-4 h-4" />
        <span className="max-w-[150px] truncate">
          {activeInstance?.displayName || activeInstance?.name || 'Select Instance'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
          data-testid="instance-switcher-dropdown"
        >
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Switch Platform
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeTenant?.tenantName}
            </p>
          </div>
          
          <div className="max-h-60 overflow-y-auto py-1">
            {availableInstances.map(instance => {
              const isActive = instance.id === activeInstance?.id
              const primaryColor = instance.primaryColor || '#6366f1'
              
              return (
                <button
                  key={instance.id}
                  onClick={() => handleSwitch(instance.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isActive 
                      ? 'bg-green-50 text-green-700' 
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                  data-testid={`instance-option-${instance.slug}`}
                >
                  {/* Color indicator */}
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {(instance.displayName || instance.name).charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {instance.displayName || instance.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {instance.suiteKeys?.length === 0 
                        ? 'All capabilities' 
                        : `${instance.suiteKeys?.length || 0} capabilities`}
                    </p>
                  </div>
                  
                  {isActive && (
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                  )}
                  
                  {instance.isDefault && !isActive && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded shrink-0">
                      Default
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact instance indicator for headers
 * Shows current instance with color accent
 */
export function InstanceIndicator({ className = '' }: { className?: string }) {
  const { activeInstance, availableInstances } = useAuth()
  
  // Don't show if single instance
  if (!availableInstances || availableInstances.length <= 1 || !activeInstance) {
    return null
  }
  
  const primaryColor = activeInstance.primaryColor || '#6366f1'
  
  return (
    <div 
      className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}
      style={{ 
        backgroundColor: `${primaryColor}15`,
        color: primaryColor 
      }}
      data-testid="instance-indicator"
    >
      <div 
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: primaryColor }}
      />
      {activeInstance.displayName || activeInstance.name}
    </div>
  )
}
