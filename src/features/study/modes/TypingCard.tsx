import { useState, useEffect, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import type { Word } from '../../../data/words.types'
import type { Grade } from '../../../srs/scheduler'
import { ChunkyButton } from '../../../components/ChunkyButton'
import { Mascot } from '../../../components/Mascot'
import { Card } from '../../../components/Card'
import { matchesAnyAlternate } from '../../../utils/text'
import { useScrollIntoView } from '../../../utils/scroll'

export function TypingCard({
  word,
  onGraded,
  onAnswerFeedback,
}: {
  word: Word
  onGraded: (grade: Grade) => void
  onAnswerFeedback?: (correct: boolean) => void
}) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null)
  const { ref: continueRef, scrollIntoView } = useScrollIntoView<HTMLDivElement>()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (result || value.trim().length === 0) return
    const correct = matchesAnyAlternate(value, word.dutchAlternates)
    setResult(correct ? 'correct' : 'incorrect')
    onAnswerFeedback?.(correct)
  }

  useEffect(() => {
    if (result) scrollIntoView()
  }, [result, scrollIntoView])

  function handleContinue() {
    onGraded(result === 'correct' ? 2 : 0)
    setValue('')
    setResult(null)
  }

  const isCorrect = result === 'correct'

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
      <Card className="w-full text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-ink-light">Type the Dutch translation</p>
        <h2 className="text-3xl font-extrabold text-ink">{word.english}</h2>
      </Card>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!!result}
          autoFocus
          className={`rounded-xl border-2 px-4 py-3 text-center text-lg outline-none ${
            result === 'correct'
              ? 'border-brand-green'
              : result === 'incorrect'
                ? 'border-brand-red'
                : 'border-cloud-dark focus:border-brand-blue'
          }`}
          placeholder="..."
        />
        {!result && (
          <ChunkyButton type="submit" variant="primary" fullWidth disabled={value.trim().length === 0}>
            Check
          </ChunkyButton>
        )}
      </form>

      {result && (
        <motion.div
          ref={continueRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="w-full"
        >
          <Card className={isCorrect ? 'bg-brand-green/10' : 'bg-brand-red/10'}>
            <div className="flex items-center gap-3">
              <Mascot pose={isCorrect ? 'happy' : 'sad'} size={56} />
              <div>
                <p className={`font-extrabold ${isCorrect ? 'text-brand-green-dark' : 'text-brand-red-dark'}`}>
                  {isCorrect ? 'Goed zo! 🎉' : 'Fout'}
                </p>
                <p className="text-sm text-ink-light">
                  "{word.dutch}" means "{word.english}".
                </p>
              </div>
            </div>
          </Card>
          <ChunkyButton variant="primary" fullWidth className="mt-3" onClick={handleContinue}>
            Volgende →
          </ChunkyButton>
        </motion.div>
      )}
    </div>
  )
}
