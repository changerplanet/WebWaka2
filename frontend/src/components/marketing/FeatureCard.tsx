import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  variant?: 'default' | 'dark'
  className?: string
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  variant = 'default',
  className,
}: FeatureCardProps) {
  const isDark = variant === 'dark'

  return (
    <div
      className={cn(
        'rounded-xl p-5',
        isDark ? 'bg-white/10 backdrop-blur-sm' : 'bg-gray-100',
        className
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
          isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
        )}
      >
        <Icon className={cn('w-5 h-5', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
      </div>
      <h4 className={cn('font-semibold mb-1', isDark ? 'text-white' : 'text-gray-900')}>
        {title}
      </h4>
      <p className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>
        {description}
      </p>
    </div>
  )
}
