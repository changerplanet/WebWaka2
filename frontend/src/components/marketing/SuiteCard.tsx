import Link from 'next/link'
import { ArrowRight, LucideIcon } from 'lucide-react'
import { Badge } from './Badge'
import { cn } from '@/lib/utils'

interface SuiteCardProps {
  id: string
  name: string
  description: string
  icon: LucideIcon
  category: 'commerce' | 'service' | 'community' | 'operations'
  demoStrength: 'strong' | 'medium' | 'mention'
  href?: string
  className?: string
}

const demoLabels = {
  strong: 'Strong Demo',
  medium: 'Guided Demo',
  mention: 'Configurable',
}

export function SuiteCard({
  id,
  name,
  description,
  icon: Icon,
  category,
  demoStrength,
  href,
  className,
}: SuiteCardProps) {
  const card = (
    <div
      className={cn(
        'bg-white rounded-xl p-6 border border-gray-200',
        'hover:border-emerald-300 hover:shadow-lg transition-all group',
        className
      )}
    >
      <Badge variant="category" category={category} className="mb-4">
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>

      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
        <Icon className="w-6 h-6 text-emerald-600" />
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2">{name}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{description}</p>

      <Badge variant={`demo-${demoStrength}`} className="mb-4">
        {demoLabels[demoStrength]}
      </Badge>

      <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium group-hover:text-emerald-700">
        Explore Demo
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{card}</Link>
  }

  return card
}
