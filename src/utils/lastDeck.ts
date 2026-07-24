const KEY = 'netjes:lastDeckId'

export function getLastDeckId(): string {
  return localStorage.getItem(KEY) ?? 'deck1'
}

export function setLastDeckId(deckId: string): void {
  localStorage.setItem(KEY, deckId)
}
