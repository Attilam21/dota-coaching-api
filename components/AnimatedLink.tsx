'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ReactNode } from 'react'

interface AnimatedLinkProps {
  href: string
  children: ReactNode
  className?: string
  active?: boolean
}

/**
 * Link animato con hover effect
 * Sostituisce Link normale con animazioni
 */
export default function AnimatedLink({ 
  href, 
  children, 
  className = '',
  active = false
}: AnimatedLinkProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link
        href={href}
        className={className}
      >
        {children}
      </Link>
    </motion.div>
  )
}

