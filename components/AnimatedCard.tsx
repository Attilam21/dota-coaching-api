'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  index?: number
}

/**
 * Card animata con fade + slide
 * Wrapper non invasivo - può essere sostituito con div normale se necessario
 */
export default function AnimatedCard({ 
  children, 
  className = '', 
  delay = 0,
  index = 0 
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: delay + (index * 0.1),
        ease: 'easeOut'
      }}
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        transition: { duration: 0.2 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

