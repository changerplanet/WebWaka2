import { cn } from '@/lib/utils'
import { Badge } from './Badge'

interface SectionHeaderProps {
  badge?: string
  title: string
  description?: string
  centered?: boolean
  variant?: 'default' | 'dark'
  className?: string
}

export function SectionHeader({
  badge,
  title,
  description,
  centered = true,
  variant = 'default',
  className,
}: SectionHeaderProps) {
  const isDark = variant === 'dark'

  return (
    <div className={cn(centered && 'text-center', 'mb-12 md:mb-16', className)}>
      {badge && (
        <div className="mb-4">
          <Badge
            className={cn(
              isDark && 'bg-white/20 text-white border-white/30'
            )}
          >
            {badge}
          </Badge>
        </div>
      )}
      <h2
        className={cn(
          'text-3xl md:text-4xl font-bold mb-4',
          isDark ? 'text-white' : 'text-gray-900'
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'text-lg max-w-2xl',
            centered && 'mx-auto',
            isDark ? 'text-gray-300' : 'text-gray-600'
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
