import { motion } from 'framer-motion'

export function ProgressBar({ pct, colorClassName = 'bg-brand-green' }: { pct: number; colorClassName?: string }) {
  return (
    <div className="app-progress-track">
      <motion.div
        className={`h-full rounded-full ${colorClassName}`}
        initial={false}
        animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      />
    </div>
  )
}
