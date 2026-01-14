import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'category' | 'demo-strong' | 'demo-medium' | 'demo-mention' | 'new' | 'default'
  category?: 'commerce' | 'service' | 'community' | 'operations'
  children: React.ReactNode
  className?: string
}

const categoryColors = {
  commerce: 'bg-blue-100 text-blue-700 border-blue-200',
  service: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  community: 'bg-pink-100 text-pink-700 border-pink-200',
  operations: 'bg-amber-100 text-amber-700 border-amber-200',
}

const demoColors = {
  'demo-strong': 'bg-green-100 text-green-700 border-green-300',
  'demo-medium': 'bg-amber-100 text-amber-700 border-amber-300',
  'demo-mention': 'bg-gray-100 text-gray-600 border-gray-300',
}

export function Badge({ variant = 'default', category, children, className }: BadgeProps) {
  const baseClasses = 'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border'

  if (variant === 'new') {
    return (
      <span className={cn(baseClasses, 'bg-amber-500 text-white border-amber-500 uppercase tracking-wide', className)}>
        {children}
      </span>
    )
  }

  if (variant === 'category' && category) {
    return (
      <span className={cn(baseClasses, categoryColors[category], className)}>
        {children}
      </span>
    )
  }

  if (variant === 'demo-strong' || variant === 'demo-medium' || variant === 'demo-mention') {
    return (
      <span className={cn(baseClasses, demoColors[variant], className)}>
        {variant === 'demo-strong' && '✓ '}
        {variant === 'demo-medium' && '◐ '}
        {variant === 'demo-mention' && '○ '}
        {children}
      </span>
    )
  }

  return (
    <span className={cn(baseClasses, 'bg-emerald-100 text-emerald-700 border-emerald-200', className)}>
      {children}
    </span>
  )
}
