'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface StickyBottomBarProps {
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  className?: string
}

export function StickyBottomBar({
  primaryLabel = 'Become a Partner',
  primaryHref = '/partners/get-started',
  secondaryLabel = 'Enter Demo',
  secondaryHref = '/demo',
  className,
}: StickyBottomBarProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'bg-white border-t border-gray-200 shadow-lg',
        'py-3 px-4',
        'transition-transform duration-300',
        isVisible ? 'translate-y-0' : 'translate-y-full',
        className
      )}
    >
      <div className="flex gap-3">
        <Link
          href={secondaryHref}
          className="flex-1 py-3 px-4 text-center font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {secondaryLabel}
        </Link>
        <Link
          href={primaryHref}
          className="flex-1 py-3 px-4 text-center font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
        >
          {primaryLabel}
        </Link>
      </div>
    </div>
  )
}
