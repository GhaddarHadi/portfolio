'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * Section reveal on scroll — a short rise and fade, like a sheet being laid
 * down. Honors prefers-reduced-motion by rendering the content plainly.
 */
export function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode
  delay?: number
}) {
  const reduced = useReducedMotion()
  if (reduced) return <>{children}</>

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
