import wordsJson from './words.json'
import decksJson from './decks.json'
import type { DeckMeta, Word } from './words.types'

export const words = wordsJson as Word[]
export const decks = decksJson as DeckMeta[]

export function getWordsForDeck(deckId: string): Word[] {
  return words.filter((w) => w.deckId === deckId)
}

export function getWordById(id: string): Word | undefined {
  return words.find((w) => w.id === id)
}
