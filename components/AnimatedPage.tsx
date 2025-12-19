'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedPageProps {
  children: ReactNode
  className?: string
}

/**
 * Wrapper per animare l'entrata della pagina
 * Non invasivo - può essere rimosso facilmente
 */
export default function AnimatedPage({ children, className = '' }: AnimatedPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

