'use client'

import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WhatsAppFABProps {
  phoneNumber?: string
  message?: string
  className?: string
}

export function WhatsAppFAB({
  phoneNumber = '2348000000000',
  message = 'Hello, I am interested in becoming a WebWaka Partner.',
  className,
}: WhatsAppFABProps) {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'w-14 h-14 rounded-full',
        'bg-[#25D366] hover:bg-[#20BD5A] hover:scale-110',
        'flex items-center justify-center',
        'shadow-lg shadow-black/20',
        'transition-all duration-200',
        className
      )}
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white" />
    </a>
  )
}
