import type { Word } from '../../data/words.types'
import type { Grade } from '../../srs/scheduler'
import { ClassicFlipCard } from './modes/ClassicFlipCard'
import { MultipleChoiceCard } from './modes/MultipleChoiceCard'
import { TypingCard } from './modes/TypingCard'
import { ListeningCard } from './modes/ListeningCard'

export type PracticeMode = 'classic' | 'multipleChoice' | 'typing' | 'listening'

export function StudyModeRenderer({
  mode,
  word,
  deckWords,
  onGraded,
  onAnswerFeedback,
}: {
  mode: string | undefined
  word: Word
  deckWords: Word[]
  onGraded: (grade: Grade) => void
  onAnswerFeedback?: (correct: boolean) => void
}) {
  switch (mode) {
    case 'multipleChoice':
      return (
        <MultipleChoiceCard
          word={word}
          deckWords={deckWords}
          onGraded={onGraded}
          onAnswerFeedback={onAnswerFeedback}
        />
      )
    case 'typing':
      return <TypingCard word={word} onGraded={onGraded} onAnswerFeedback={onAnswerFeedback} />
    case 'listening':
      return (
        <ListeningCard
          word={word}
          deckWords={deckWords}
          onGraded={onGraded}
          onAnswerFeedback={onAnswerFeedback}
        />
      )
    default:
      return <ClassicFlipCard word={word} onGraded={onGraded} onAnswerFeedback={onAnswerFeedback} />
  }
}
