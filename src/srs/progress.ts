import type { CardState } from './scheduler'
import type { Word } from '../data/words.types'

export interface DeckProgress {
  total: number
  studied: number
  mastered: number
  due: number
}

const MASTERED_INTERVAL_DAYS = 21

export function computeDeckProgress(
  words: Word[],
  cardStates: Map<string, CardState>,
  today: string,
): DeckProgress {
  let studied = 0
  let mastered = 0
  let due = 0

  for (const word of words) {
    const state = cardStates.get(word.id)
    if (!state) continue
    studied += 1
    if (state.intervalDays >= MASTERED_INTERVAL_DAYS) mastered += 1
    if (state.dueDate <= today) due += 1
  }

  return { total: words.length, studied, mastered, due }
}
