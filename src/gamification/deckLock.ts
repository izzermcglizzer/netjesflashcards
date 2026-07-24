import { decks } from '../data'
import type { DeckId } from '../data/words.types'

/** The achievement code unlocked when a deck's Rank-Up Exam is passed at the required score. */
export function rankUpAchievementCode(deckId: DeckId): string {
  return `${deckId}_rankup_passed`
}

/** Deck 1 is always open; deck N+1 requires deck N's Rank-Up Exam to have been passed. */
export function isDeckLocked(deckId: DeckId, unlockedAchievements: Set<string>): boolean {
  const deck = decks.find((d) => d.id === deckId)
  if (!deck || deck.order <= 1) return false
  const prevDeck = decks.find((d) => d.order === deck.order - 1)
  if (!prevDeck) return false
  return !unlockedAchievements.has(rankUpAchievementCode(prevDeck.id))
}
