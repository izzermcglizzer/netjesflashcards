import { AnimatePresence, motion } from 'framer-motion'

export function FlashOverlay({ flash }: { flash: 'correct' | 'incorrect' | null }) {
  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`pointer-events-none fixed inset-0 z-40 ${
            flash === 'correct' ? 'bg-brand-green' : 'bg-brand-red'
          }`}
        />
      )}
    </AnimatePresence>
  )
}
