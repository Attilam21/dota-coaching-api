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
      viewBox="0 0 140 140"
      className={svgClassName}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradiente metallico principale - più realistico */}
        <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="25%" stopColor="#4b5563" />
          <stop offset="50%" stopColor="#374151" />
          <stop offset="75%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        
        {/* Gradiente argento brillante */}
        <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3f4f6" />
          <stop offset="30%" stopColor="#e5e7eb" />
          <stop offset="60%" stopColor="#d1d5db" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>
        
        {/* Gradiente per highlights */}
        <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        
        {/* Gradiente per ombre */}
        <linearGradient id="shadowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
        </linearGradient>
        
        {/* Gradiente diamante rosso */}
        <linearGradient id="redDiamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      
      {/* Base principale dell'elmo - forma più complessa con ali laterali */}
      <path
        d="M70 15 L110 35 L115 50 L110 75 L70 100 L30 75 L25 50 L30 35 Z"
        fill="url(#metalGradient)"
        stroke="#1f2937"
        strokeWidth="1.5"
      />
      
      {/* Cresta superiore appuntita e prominente */}
      <path
        d="M55 15 L70 8 L85 15 L80 32 L60 32 Z"
        fill="url(#silverGradient)"
        stroke="#4b5563"
        strokeWidth="1.5"
      />
      <path
        d="M60 15 L70 10 L80 15 L75 28 L65 28 Z"
        fill="url(#highlightGradient)"
      />
      
      {/* Ali/Spalline laterali sinistra */}
      <path
        d="M25 50 L15 45 L10 55 L15 65 L25 60 Z"
        fill="url(#metalGradient)"
        stroke="#1f2937"
        strokeWidth="1"
      />
      <path
        d="M20 52 L12 48 L10 55 L12 62 L20 58 Z"
        fill="url(#silverGradient)"
        opacity="0.5"
      />
      
      {/* Ali/Spalline laterali destra */}
      <path
        d="M115 50 L125 45 L130 55 L125 65 L115 60 Z"
        fill="url(#metalGradient)"
        stroke="#1f2937"
        strokeWidth="1"
      />
      <path
        d="M120 52 L128 48 L130 55 L128 62 L120 58 Z"
        fill="url(#silverGradient)"
        opacity="0.5"
      />
      
      {/* Piastre metalliche superiori */}
      <path
        d="M40 35 L55 30 L70 35 L65 50 L50 50 Z"
        fill="url(#silverGradient)"
        opacity="0.7"
        stroke="#6b7280"
        strokeWidth="0.5"
      />
      <path
        d="M70 35 L85 30 L100 35 L95 50 L80 50 Z"
        fill="url(#silverGradient)"
        opacity="0.7"
        stroke="#6b7280"
        strokeWidth="0.5"
      />
      
      {/* Highlight sulle piastre */}
      <path
        d="M45 38 L55 35 L65 38 L60 48 L50 48 Z"
        fill="url(#highlightGradient)"
      />
      <path
        d="M75 38 L85 35 L95 38 L90 48 L80 48 Z"
        fill="url(#highlightGradient)"
      />
      
      {/* Diamante rosso centrale - più grande e prominente */}
      <path
        d="M70 55 L80 50 L85 60 L80 70 L70 70 L65 60 Z"
        fill="url(#redDiamondGradient)"
        stroke="#991b1b"
        strokeWidth="2"
      />
      {/* Highlight sul diamante */}
      <path
        d="M70 58 L76 54 L78 60 L76 66 L70 66 L68 60 Z"
        fill="url(#highlightGradient)"
      />
      
      {/* Piastre metalliche inferiori - più dettagliate */}
      <path
        d="M45 60 L55 55 L65 60 L60 75 L50 75 Z"
        fill="url(#silverGradient)"
        opacity="0.5"
        stroke="#6b7280"
        strokeWidth="0.5"
      />
      <path
        d="M75 60 L85 55 L95 60 L90 75 L80 75 Z"
        fill="url(#silverGradient)"
        opacity="0.5"
        stroke="#6b7280"
        strokeWidth="0.5"
      />
      
      {/* Pattern stilizzato A/M - più definito */}
      <path
        d="M50 70 L58 62 L65 70 L60 82 L55 82 Z"
        fill="url(#silverGradient)"
        opacity="0.4"
      />
      <path
        d="M75 70 L83 62 L90 70 L85 82 L80 82 Z"
        fill="url(#silverGradient)"
        opacity="0.4"
      />
      
      {/* Ombre e profondità - più realistiche */}
      <path
        d="M25 50 L70 15 L115 50"
        stroke="#111827"
        strokeWidth="1.5"
        opacity="0.6"
      />
      <path
        d="M30 35 L70 15 L110 35"
        stroke="#1f2937"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M25 75 L70 100 L115 75"
        stroke="#4b5563"
        strokeWidth="1"
        opacity="0.3"
      />
      
      {/* Ombre laterali */}
      <path
        d="M15 45 L25 50 L25 60 L15 65 Z"
        fill="url(#shadowGradient)"
      />
      <path
        d="M125 45 L115 50 L115 60 L125 65 Z"
        fill="url(#shadowGradient)"
      />
      
      {/* Highlights finali per profondità */}
      <path
        d="M35 40 L70 20 L105 40"
        stroke="#9ca3af"
        strokeWidth="0.5"
        opacity="0.3"
      />
    </svg>
  )
}

export default function Logo({ className = '', showText = false, size = 'md', href }: LogoProps) {
  // Dimensioni orizzontali per rispettare le proporzioni del logo (emblema + testo)
  const sizeClasses = {
    sm: 'h-8',  // Altezza fissa
    md: 'h-12',
    lg: 'h-16'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  const [showImage, setShowImage] = React.useState(true)

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo - Immagine JPEG così com'è, adattata alle dimensioni orizzontali */}
      <div 
        className={`relative ${sizeClasses[size]} flex-shrink-0`} 
        style={{ 
          aspectRatio: '3.5 / 1',  // Proporzioni orizzontali del logo
          width: 'auto'
        }}
      >
        {showImage ? (
          /* Immagine JPEG - mostra il logo completo così com'è, mantenendo proporzioni orizzontali */
          <Image
            src="/logo.jpeg"
            alt="ATTILA LAB Logo"
            fill
            className="object-contain"
            priority
            onError={() => {
              // Se l'immagine non esiste, mostra l'SVG elmo come fallback
              setShowImage(false)
            }}
          />
        ) : (
          /* SVG elmo - fallback se l'immagine non è disponibile */
          <div className="w-full h-full">
            <HelmetLogo className="w-full h-full" />
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
