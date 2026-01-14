'use client'

import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

interface DemoIndicatorProps {
  variant?: 'badge' | 'banner' | 'subtle'
  className?: string
}

export function DemoIndicator({ variant = 'badge', className = '' }: DemoIndicatorProps) {
  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-green-200 px-4 py-2 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-sm text-green-700">
          <Sparkles className="h-4 w-4" />
          <span>Demo Environment - Sample data for demonstration purposes</span>
        </div>
      </div>
    )
  }

  if (variant === 'subtle') {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-slate-400 ${className}`}>
        <Sparkles className="h-3 w-3" />
        Sample data
      </span>
    )
  }

  return (
    <Badge variant="outline" className={`bg-green-50 text-green-700 border-green-200 ${className}`}>
      <Sparkles className="h-3 w-3 mr-1" />
      Demo
    </Badge>
  )
}

export function EmptyStateMessage({ 
  title, 
  description, 
  icon: Icon,
  action
}: { 
  title: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-4">{description}</p>
      {action}
    </div>
  )
}
