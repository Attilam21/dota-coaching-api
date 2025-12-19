'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedButtonProps {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}

/**
 * Bottone animato con effetti interattivi
 * Hover: scale + lift
 * Click: scale down (feedback tattile)
 */
export default function AnimatedButton({ 
  children, 
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  variant = 'primary'
}: AnimatedButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-lg text-sm font-semibold transition-colors'
  
  const variantClasses = {
    primary: 'bg-red-600 hover:bg-red-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-700 hover:bg-red-800 text-white',
    ghost: 'bg-transparent hover:bg-gray-700 text-gray-300'
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </motion.button>
  )
}

