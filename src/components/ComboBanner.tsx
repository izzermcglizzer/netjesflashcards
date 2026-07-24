import { AnimatePresence, motion } from 'framer-motion'
import { Mascot } from './Mascot'

export function ComboBanner({ count }: { count: number | null }) {
  return (
    <AnimatePresence>
      {count !== null && (
        <motion.div
          key={count}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20"
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: [0, 1.25, 1], rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            className="flex flex-col items-center gap-2"
          >
            <Mascot pose="happy" size={180} />
            <motion.p
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="text-3xl font-extrabold text-white drop-shadow-md"
            >
              YAY! 🎉
            </motion.p>
            <p className="text-lg font-extrabold text-white drop-shadow-md">🔥 {count} in a row!</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
