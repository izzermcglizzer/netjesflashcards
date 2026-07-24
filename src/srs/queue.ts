import type { Word, DeckId } from '../data/words.types'
import type { CardState } from './scheduler'

export interface QueueItem {
  word: Word
  state: CardState // always has state — only learned (already-introduced) words reach this queue
}

// Deck 1's "unsorted" words are actually its most basic vocabulary (hi, hello,
// good morning...) — they should be learned before the numbered chapters, not
// after. Other decks' unsorted words are genuine miscellany, so they stay last.
const UNSORTED_FIRST_DECKS = new Set<DeckId>(['deck1'])

function chapterSortKey(word: Word): string {
  return word.chapter ?? '￿' // unsorted last by default
}

function byChapterThenId(a: Word, b: Word): number {
  const chapterCompare = chapterSortKey(a).localeCompare(chapterSortKey(b))
  return chapterCompare !== 0 ? chapterCompare : a.id.localeCompare(b.id)
}

/** Numeric-aware comparison for chapter codes like "3-2" vs "3-10" (plain string sort gets these wrong). */
export function compareChapters(a: string, b: string): number {
  const [aMajor, aMinor] = a.split('-').map(Number)
  const [bMajor, bMinor] = b.split('-').map(Number)
  return aMajor !== bMajor ? aMajor - bMajor : aMinor - bMinor
}

/**
 * The regular study queue (Flip Cards, Multiple Choice, Typing, Listening):
 * only words that have already been through "Learn New Words" (i.e. already
 * have SRS state) are eligible, and only once they're actually due. Brand-new
 * words never appear here — they must be learned first.
 */
export function buildQueue(words: Word[], cardStates: Map<string, CardState>, opts: { today: string }): QueueItem[] {
  const due: QueueItem[] = []
  for (const word of words) {
    const state = cardStates.get(word.id)
    if (state && state.dueDate <= opts.today) due.push({ word, state })
  }
  return due.sort((a, b) => byChapterThenId(a.word, b.word))
}

/**
 * On-demand chapter drill (from Browse by Chapter): every already-learned word
 * in the chapter, regardless of due date — the user explicitly chose to
 * practice this chapter, so the daily due-date throttle doesn't apply. Still
 * excludes never-learned words, since practice modes require learned status.
 */
export function buildChapterPracticeQueue(words: Word[], cardStates: Map<string, CardState>): QueueItem[] {
  const learned: QueueItem[] = []
  for (const word of words) {
    const state = cardStates.get(word.id)
    if (state) learned.push({ word, state })
  }
  return learned.sort((a, b) => byChapterThenId(a.word, b.word))
}

export function buildCustomPracticeQueue(
  words: Word[],
  cardStates: Map<string, CardState>,
  count: number,
): QueueItem[] {
  const learnedWords = sampleAcrossChapters(words, cardStates, count)
  return learnedWords
    .map((word) => {
      const state = cardStates.get(word.id)
      return state ? { word, state } : null
    })
    .filter((item): item is QueueItem => item !== null)
}

/** Words in the given set that haven't been learned yet (no SRS state at all). */
export function getUnlearnedWords(words: Word[], cardStates: Map<string, CardState>, cap: number): Word[] {
  return words
    .filter((w) => !cardStates.has(w.id))
    .sort(byChapterThenId)
    .slice(0, cap)
}

export function isChapterLearned(chapterWords: Word[], cardStates: Map<string, CardState>): boolean {
  return chapterWords.length > 0 && chapterWords.every((w) => cardStates.has(w.id))
}

/** Ordered chapter keys for a deck (null = unsorted bucket), respecting UNSORTED_FIRST_DECKS. */
function orderedChapterKeys(words: Word[]): (string | null)[] {
  const chapterSet = new Set<string>()
  let hasUnsorted = false
  for (const word of words) {
    if (word.chapter) chapterSet.add(word.chapter)
    else hasUnsorted = true
  }
  const numbered = [...chapterSet].sort(compareChapters)
  if (!hasUnsorted) return numbered

  const unsortedFirst = words.length > 0 && UNSORTED_FIRST_DECKS.has(words[0].deckId)
  return unsortedFirst ? [null, ...numbered] : [...numbered, null]
}

export interface ChapterLockInfo {
  chapter: string | null
  words: Word[]
  learned: boolean
  locked: boolean
}

/**
 * Chapters unlock in order (see orderedChapterKeys for that order, including
 * where the unsorted bucket falls): the next chapter is locked until every
 * word in all prior chapters has been learned.
 */
export function getChapterLockInfo(words: Word[], cardStates: Map<string, CardState>): ChapterLockInfo[] {
  const keys = orderedChapterKeys(words)

  let priorLearned = true
  return keys.map((chapter) => {
    const chapterWords = chapter === null ? words.filter((w) => !w.chapter) : words.filter((w) => w.chapter === chapter)
    const learned = isChapterLearned(chapterWords, cardStates)
    const locked = !priorLearned
    priorLearned = priorLearned && learned
    return { chapter, words: chapterWords, learned, locked }
  })
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Samples up to `count` already-learned words, round-robining across every
 * chapter so a big exam actually covers the whole deck instead of leaving
 * chapter coverage to chance the way a flat shuffle would.
 */
export function sampleAcrossChapters(words: Word[], cardStates: Map<string, CardState>, count: number): Word[] {
  const keys = orderedChapterKeys(words)
  const pools = keys.map((chapter) => {
    const chapterWords = chapter === null ? words.filter((w) => !w.chapter) : words.filter((w) => w.chapter === chapter)
    return shuffleInPlace(chapterWords.filter((w) => cardStates.has(w.id)))
  })

  const sample: Word[] = []
  let anyLeft = true
  for (let round = 0; anyLeft && sample.length < count; round++) {
    anyLeft = false
    for (const pool of pools) {
      if (sample.length >= count) break
      if (round < pool.length) {
        sample.push(pool[round])
        anyLeft = true
      }
    }
  }
  return sample
}
