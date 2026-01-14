'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface ButtonProps {
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'whatsapp'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  children: React.ReactNode
  className?: string
  'data-testid'?: string
}

const variants = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20',
  secondary: 'bg-transparent border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  whatsapp: 'bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg',
}

const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-base',
  lg: 'h-13 px-8 text-lg',
}

export function Button({
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'right',
  fullWidth = false,
  children,
  className,
  'data-testid': testId,
}: ButtonProps) {
  const baseClasses = cn(
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-[0.98]',
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className
  )

  const content = (
    <>
      {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={baseClasses} data-testid={testId}>
        {content}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={baseClasses} data-testid={testId}>
      {content}
    </button>
  )
}
