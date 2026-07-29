import { useEffect, useState } from 'react'
import { getWordsForDeck } from '../../data'
import type { DeckId } from '../../data/words.types'
import { getCardStatesForDeck } from '../../api/cardState'
import { buildQueue, buildChapterPracticeQueue, type QueueItem } from '../../srs/queue'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Regular practice queue (Flip Cards, Multiple Choice, Typing, Listening):
 * only already-learned words are eligible — see buildQueue / buildChapterPracticeQueue.
 * Custom Practice sessions build their own queue directly (see
 * srs/queue.ts's buildDueQueue/buildRecentlyLearnedQueue) rather than going
 * through this hook, since they aren't chapter-scoped.
 */
export function useStudyQueue(userId: string, deckId: DeckId, opts?: { chapterFilter?: string | null }) {
  const [items, setItems] = useState<QueueItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const chapterFilter = opts?.chapterFilter

  useEffect(() => {
    let cancelled = false
    setItems(null)
    setError(null)

    getCardStatesForDeck(userId, deckId)
      .then((cardStates) => {
        if (cancelled) return
        const allWords = getWordsForDeck(deckId)
        if (chapterFilter === undefined) {
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
  }, [userId, deckId, chapterFilter])

  return { items, loading: items === null && !error, error }
}
