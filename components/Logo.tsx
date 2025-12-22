'use client'

import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  href?: string
}

export default function Logo({ className = '', showText = true, size = 'md', href }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image */}
      <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
        <Image
          src="/attila-lab-logo.png"
          alt="ATTILA LAB Logo"
          fill
          className="object-contain"
          priority
          onError={(e) => {
            // Fallback se l'immagine non esiste
            const target = e.target as HTMLImageElement
            if (target.parentElement) {
              target.parentElement.innerHTML = `
                <div class="flex items-center gap-2">
                  <div class="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-red-500 flex items-center justify-center">
                    <span class="text-red-500 font-bold text-xs">AL</span>
                  </div>
                </div>
              `
            }
          }}
        />
      </div>
      
      {/* Text */}
      {showText && (
        <div className={`font-bold ${textSizeClasses[size]}`}>
          <span className="text-gray-300">ATTILA</span>
          <span className="text-red-500"> LAB</span>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    )
  }

  return content
}

