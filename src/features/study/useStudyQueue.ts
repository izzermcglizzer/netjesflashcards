import { useEffect, useState } from 'react'
import { getWordsForDeck } from '../../data'
import type { DeckId } from '../../data/words.types'
import { getCardStatesForDeck } from '../../api/cardState'
import { buildQueue, buildChapterPracticeQueue, buildCustomPracticeQueue, type QueueItem } from '../../srs/queue'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Regular practice queue (Flip Cards, Multiple Choice, Typing, Listening):
 * only already-learned words are eligible — see buildQueue / buildChapterPracticeQueue.
 */
export function useStudyQueue(
  userId: string,
  deckId: DeckId,
  opts?: { chapterFilter?: string | null; practiceCount?: number | null },
) {
  const [items, setItems] = useState<QueueItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const chapterFilter = opts?.chapterFilter
  const practiceCount = opts?.practiceCount

  useEffect(() => {
    let cancelled = false
    setItems(null)
    setError(null)

    getCardStatesForDeck(userId, deckId)
      .then((cardStates) => {
        if (cancelled) return
        const allWords = getWordsForDeck(deckId)
        if (typeof practiceCount === 'number' && practiceCount > 0 && chapterFilter === undefined) {
          setItems(buildCustomPracticeQueue(allWords, cardStates, practiceCount))
        } else if (chapterFilter === undefined) {
          setItems(buildQueue(allWords, cardStates, { today: todayIso() }))
        } else {
          const chapterWords = allWords.filter((w) => w.chapter === chapterFilter)
          setItems(buildChapterPracticeQueue(chapterWords, cardStates))
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })

    return () => {
      cancelled = true
    }
  }, [userId, deckId, chapterFilter, practiceCount])

  return { items, loading: items === null && !error, error }
}
