export type DeckId = 'deck1' | 'deck2' | 'deck3'

export interface Word {
  id: string
  deckId: DeckId
  english: string
  englishAlternates: string[]
  dutch: string
  dutchAlternates: string[]
  notesEn: string | null
  notesNl: string | null
  audioFile: string | null
  imageFile: string | null
  chapter: string | null
}

export interface DeckMeta {
  id: DeckId
  label: string
  order: number
  noteCount: number
}
