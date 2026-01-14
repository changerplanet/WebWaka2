import Link from 'next/link'
import { Badge } from './Badge'
import { cn } from '@/lib/utils'

interface DemoTenantCardProps {
  name: string
  slug: string
  industry: string
  category: 'commerce' | 'service' | 'community' | 'operations'
  stats: string
  href: string
  className?: string
}

export function DemoTenantCard({
  name,
  slug,
  industry,
  category,
  stats,
  href,
  className,
}: DemoTenantCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl p-5 border border-gray-200',
        'hover:border-emerald-300 hover:shadow-lg transition-all',
        className
      )}
    >
      <Badge variant="category" category={category} className="mb-3">
        {industry}
      </Badge>

      <h3 className="text-lg font-bold text-gray-900 mb-1">{name}</h3>
      <p className="text-sm text-gray-500 font-mono mb-3">{slug}</p>
      <p className="text-sm text-gray-600 mb-4">{stats}</p>

      <Link
        href={href}
        className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors text-sm"
      >
        Enter Demo
      </Link>
    </div>
  )
}
