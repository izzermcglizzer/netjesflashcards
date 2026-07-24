import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Word } from '../../../data/words.types'
import { ChunkyButton } from '../../../components/ChunkyButton'
import { Card } from '../../../components/Card'
import { splitLines } from '../../../utils/html'

/**
 * The Anki-style "add the card" step: no grading, just introduce the word and
 * move on. This is the only place a brand-new word is ever shown — once the
 * user taps through it here, it becomes eligible for the graded practice modes.
 */
export function LearnCard({ word, onNext }: { word: Word; onNext: () => void }) {
  const [revealed, setRevealed] = useState(false)

  function playAudio() {
    if (!word.audioFile) return
    new Audio(`/media/${word.deckId}/${word.audioFile}`).play().catch(() => {})
  }

  function handleNext() {
    setRevealed(false)
    onNext()
  }

  function handleReveal() {
    setRevealed(true)
    playAudio()
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={word.id}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="w-full"
        >
          <Card className="flex flex-col items-center gap-4 p-8 text-center">
            {word.imageFile && (
              <img
                src={`/media/${word.deckId}/${word.imageFile}`}
                alt=""
                className="h-28 w-28 rounded-2xl object-cover"
              />
            )}
            <p className="text-sm font-bold uppercase tracking-wide text-ink-light">English</p>
            <h2 className="text-3xl font-extrabold text-ink">{word.english}</h2>

            {revealed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex w-full flex-col items-center gap-2 border-t-2 border-cloud-dark pt-4"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-extrabold text-brand-blue">{word.dutch}</h3>
                  {word.audioFile && (
                    <button
                      type="button"
                      onClick={playAudio}
                      aria-label="Play pronunciation"
                      className="rounded-full bg-cloud p-2 text-brand-blue hover:bg-cloud-dark"
                    >
                      🔊
                    </button>
                  )}
                </div>
                {splitLines(word.notesNl).map((line, i) => (
                  <p key={i} className="text-sm text-ink-light">
                    {line}
                  </p>
                ))}
              </motion.div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      <ChunkyButton
        variant={revealed ? 'primary' : 'neutral'}
        fullWidth
        onClick={revealed ? handleNext : handleReveal}
      >
        {revealed ? 'Got it, next! →' : 'Show answer'}
      </ChunkyButton>
    </div>
  )
}
