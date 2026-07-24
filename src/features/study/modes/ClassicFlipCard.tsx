import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Word } from '../../../data/words.types'
import type { Grade } from '../../../srs/scheduler'
import { ChunkyButton } from '../../../components/ChunkyButton'
import { Card } from '../../../components/Card'
import { splitLines } from '../../../utils/html'

export function ClassicFlipCard({
  word,
  onGraded,
  onAnswerFeedback,
}: {
  word: Word
  onGraded: (grade: Grade) => void
  onAnswerFeedback?: (correct: boolean) => void
}) {
  const [revealed, setRevealed] = useState(false)

  function playAudio() {
    if (!word.audioFile) return
    new Audio(`/media/${word.deckId}/${word.audioFile}`).play().catch(() => {})
  }

  function handleGrade(grade: Grade) {
    onAnswerFeedback?.(grade >= 2)
    setRevealed(false)
    onGraded(grade)
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
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

            {revealed ? (
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
            ) : (
              <ChunkyButton variant="neutral" onClick={() => setRevealed(true)}>
                Show answer
              </ChunkyButton>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {revealed && (
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          <ChunkyButton variant="danger" onClick={() => handleGrade(0)}>
            Again
          </ChunkyButton>
          <ChunkyButton variant="neutral" onClick={() => handleGrade(1)}>
            Hard
          </ChunkyButton>
          <ChunkyButton variant="primary" onClick={() => handleGrade(2)}>
            Good
          </ChunkyButton>
          <ChunkyButton variant="secondary" onClick={() => handleGrade(3)}>
            Easy
          </ChunkyButton>
        </div>
      )}
    </div>
  )
}
