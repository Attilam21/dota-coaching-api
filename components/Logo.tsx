'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  href?: string
}

// SVG del logo con elmo stilizzato - definito fuori dal componente per evitare problemi di riconciliazione
function HelmetLogo({ className: svgClassName }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={svgClassName}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Elmo/Scudo esagonale stilizzato */}
      <defs>
        <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4a5568" />
          <stop offset="50%" stopColor="#2d3748" />
          <stop offset="100%" stopColor="#1a202c" />
        </linearGradient>
        <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e0" />
          <stop offset="50%" stopColor="#a0aec0" />
          <stop offset="100%" stopColor="#718096" />
        </linearGradient>
      </defs>
      
      {/* Base esagonale/elmo */}
      <path
        d="M60 10 L100 30 L100 70 L60 90 L20 70 L20 30 Z"
        fill="url(#metalGradient)"
        stroke="#1a202c"
        strokeWidth="2"
      />
      
      {/* Cresta/Spike superiore */}
      <path
        d="M50 10 L60 5 L70 10 L65 25 L55 25 Z"
        fill="url(#silverGradient)"
        stroke="#4a5568"
        strokeWidth="1.5"
      />
      
      {/* Pattern piastre metalliche */}
      <path
        d="M35 40 L50 35 L65 40 L60 55 L45 55 Z"
        fill="url(#silverGradient)"
        opacity="0.6"
      />
      <path
        d="M55 40 L70 35 L85 40 L80 55 L65 55 Z"
        fill="url(#silverGradient)"
        opacity="0.6"
      />
      
      {/* Diamante rosso centrale */}
      <path
        d="M60 50 L70 45 L75 55 L70 65 L60 65 L55 55 Z"
        fill="#ef4444"
        stroke="#dc2626"
        strokeWidth="1.5"
      />
      
      {/* Pattern stilizzato A/M */}
      <path
        d="M45 60 L55 50 L60 60 L55 70 L45 70 Z"
        fill="url(#silverGradient)"
        opacity="0.4"
      />
      <path
        d="M60 60 L70 50 L75 60 L70 70 L60 70 Z"
        fill="url(#silverGradient)"
        opacity="0.4"
      />
      
      {/* Dettagli ombre e profondità */}
      <path
        d="M20 30 L60 10 L100 30"
        stroke="#1a202c"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M20 70 L60 90 L100 70"
        stroke="#4a5568"
        strokeWidth="1"
        opacity="0.3"
      />
    </svg>
  )
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

  const [showImage, setShowImage] = React.useState(true)

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo - SVG elmo come default, immagine PNG se disponibile */}
      <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
        {/* SVG elmo - sempre presente come base */}
        <div className="w-full h-full">
          <HelmetLogo className="w-full h-full" />
        </div>
        
        {/* Immagine PNG - sovrapposta se disponibile */}
        {showImage && (
          <div className="absolute inset-0 w-full h-full">
            <Image
              src="/attila-lab-logo.png"
              alt="ATTILA LAB Logo"
              fill
              className="object-contain"
              priority
              onError={() => {
                // Nascondi l'immagine se non esiste, l'SVG rimane visibile
                setShowImage(false)
              }}
            />
          </div>
        )}
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
