import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Word } from '../../../data/words.types'
import type { Grade } from '../../../srs/scheduler'
import { ChunkyButton } from '../../../components/ChunkyButton'
import { Mascot } from '../../../components/Mascot'
import { Card } from '../../../components/Card'
import { shuffle, pickDistractors } from '../../../utils/array'
import { useScrollIntoView } from '../../../utils/scroll'

export function MultipleChoiceCard({
  word,
  deckWords,
  onGraded,
  onAnswerFeedback,
}: {
  word: Word
  deckWords: Word[]
  onGraded: (grade: Grade) => void
  onAnswerFeedback?: (correct: boolean) => void
}) {
  const options = useMemo(() => {
    const pool = deckWords.filter((w) => w.id !== word.id && w.dutch !== word.dutch)
    const distractorDutch = pickDistractors(
      word.dutch,
      pool.map((w) => w.dutch),
      3,
    )
    const distractorWords = distractorDutch.map((d) => pool.find((w) => w.dutch === d)!).filter(Boolean)
    return shuffle([word, ...distractorWords])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.id])

  const [selected, setSelected] = useState<Word | null>(null)
  const { ref: continueRef, scrollIntoView } = useScrollIntoView<HTMLDivElement>()

  function choose(option: Word) {
    if (selected) return
    setSelected(option)
    const correct = option.id === word.id
    onAnswerFeedback?.(correct)
  }

  useEffect(() => {
    if (selected) scrollIntoView()
  }, [selected, scrollIntoView])

  function handleContinue() {
    onGraded(selected?.id === word.id ? 2 : 0)
    setSelected(null)
  }

  const isCorrectSelected = selected?.id === word.id

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
      <Card className="w-full text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-ink-light">What does this mean?</p>
        <h2 className="text-3xl font-extrabold text-ink">{word.english}</h2>
      </Card>

      <div className="flex w-full flex-col gap-3">
        {options.map((option, i) => {
          const isCorrect = option.id === word.id
          const isSelected = option.id === selected?.id
          const answered = selected !== null

          let rowClasses = 'border-cloud-dark bg-white'
          if (answered && isCorrect) rowClasses = 'border-brand-green bg-brand-green/10'
          else if (answered && isSelected) rowClasses = 'border-brand-red bg-brand-red/10'

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => choose(option)}
              disabled={answered}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${rowClasses} ${
                answered && !isCorrect && !isSelected ? 'opacity-50' : ''
              }`}
            >
              <span className="app-icon-badge h-8 w-8 border-2 border-cloud-dark text-sm font-extrabold text-ink-light">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className={`font-extrabold ${answered && isCorrect ? 'text-brand-green-dark' : 'text-ink'}`}>
                  {option.dutch}
                </p>
                {answered && <p className="text-sm text-ink-light">{option.english}</p>}
              </div>
              {answered && isCorrect && (
                <span className="app-icon-badge h-7 w-7 bg-brand-green text-sm text-white">✓</span>
              )}
              {answered && isSelected && !isCorrect && (
                <span className="app-icon-badge h-7 w-7 bg-brand-red text-sm text-white">✕</span>
              )}
            </button>
          )
        })}
      </div>

      {selected && (
        <motion.div
          ref={continueRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="w-full"
        >
          <Card className={isCorrectSelected ? 'bg-brand-green/10' : 'bg-brand-red/10'}>
            <div className="flex items-center gap-3">
              <Mascot pose={isCorrectSelected ? 'happy' : 'sad'} size={56} />
              <div>
                <p className={`font-extrabold ${isCorrectSelected ? 'text-brand-green-dark' : 'text-brand-red-dark'}`}>
                  {isCorrectSelected ? 'Goed zo! 🎉' : 'Fout'}
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
