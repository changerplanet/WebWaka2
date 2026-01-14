import { cn } from '@/lib/utils'

interface StatsCardProps {
  value: string
  label: string
  variant?: 'default' | 'dark'
  className?: string
}

export function StatsCard({ value, label, variant = 'default', className }: StatsCardProps) {
  const isDark = variant === 'dark'

  return (
    <div
      className={cn(
        'rounded-lg p-6 text-center',
        isDark ? 'bg-white/10 backdrop-blur-sm' : 'bg-gray-100',
        className
      )}
    >
      <div className={cn('text-3xl md:text-4xl font-bold mb-1', isDark ? 'text-white' : 'text-emerald-600')}>
        {value}
      </div>
      <p className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>{label}</p>
    </div>
  )
}
