import { describe, expect, it } from 'vitest'
import {
  buildChapterPracticeQueue,
  buildDueQueue,
  buildQueue,
  buildRecentlyLearnedQueue,
  compareChapters,
  getChapterLockInfo,
  getUnlearnedWords,
  isChapterLearned,
  sampleAcrossChapters,
} from './queue'
import type { CardState } from './scheduler'
import type { DeckId, Word } from '../data/words.types'

const TODAY = '2026-07-24'

function makeWord(id: string, chapter: string | null, deckId: DeckId = 'deck1'): Word {
  return {
    id,
    deckId,
    english: `word-${id}`,
    englishAlternates: [`word-${id}`],
    dutch: `woord-${id}`,
    dutchAlternates: [`woord-${id}`],
    notesEn: null,
    notesNl: null,
    audioFile: null,
    imageFile: null,
    chapter,
  }
}

function dueState(dueDate: string): CardState {
  return { easeFactor: 2.5, intervalDays: 1, repetitions: 1, dueDate }
}

describe('compareChapters', () => {
  it('orders multi-digit minor numbers numerically, not lexicographically', () => {
    const chapters = ['3-10', '3-2', '3-1']
    expect([...chapters].sort(compareChapters)).toEqual(['3-1', '3-2', '3-10'])
  })

  it('orders by major number first', () => {
    expect(compareChapters('2-5', '10-1')).toBeLessThan(0)
  })
})

describe('buildQueue', () => {
  it('only includes already-learned words that are actually due', () => {
    const words = [makeWord('a', '2-1'), makeWord('b', '1-1'), makeWord('c', '1-2')]
    const cardStates = new Map([
      ['a', dueState('2026-07-20')], // learned, overdue
      ['b', dueState('2026-07-24')], // learned, due today
      // 'c' never learned — must not appear even though it's "new"
    ])
    const items = buildQueue(words, cardStates, { today: TODAY })
    expect(items.map((i) => i.word.id)).toEqual(['b', 'a'])
  })

  it('excludes learned words that are not due yet', () => {
    const words = [makeWord('a', '1-1')]
    const cardStates = new Map([['a', dueState('2026-08-01')]])
    expect(buildQueue(words, cardStates, { today: TODAY })).toEqual([])
  })
})

describe('buildChapterPracticeQueue', () => {
  it('includes any learned word regardless of due date, but excludes never-learned words', () => {
    const words = [makeWord('a', '2-2'), makeWord('b', '2-2'), makeWord('c', '2-2')]
    const cardStates = new Map([
      ['a', dueState('2026-08-01')], // learned, not due again for a while
      ['b', dueState('2026-06-01')], // learned, overdue
      // 'c' never learned
    ])
    const chapterQueue = buildChapterPracticeQueue(words, cardStates)
    expect(chapterQueue.map((i) => i.word.id).sort()).toEqual(['a', 'b'])
  })

  it('is not capped — every learned word in the chapter comes back', () => {
    const words = Array.from({ length: 20 }, (_, i) => makeWord(`w${i}`, '1-1'))
    const cardStates = new Map(words.map((w) => [w.id, dueState('2026-08-01')]))
    expect(buildChapterPracticeQueue(words, cardStates)).toHaveLength(20)
  })
})

describe('getUnlearnedWords', () => {
  it('returns only words without SRS state, capped', () => {
    const words = [makeWord('a', '1-1'), makeWord('b', '1-1'), makeWord('c', '1-1')]
    const cardStates = new Map([['a', dueState('2026-08-01')]])
    expect(getUnlearnedWords(words, cardStates, 10).map((w) => w.id)).toEqual(['b', 'c'])
    expect(getUnlearnedWords(words, cardStates, 1).map((w) => w.id)).toEqual(['b'])
  })
})

describe('isChapterLearned', () => {
  it('is true only when every word in the chapter has state', () => {
    const words = [makeWord('a', '1-1'), makeWord('b', '1-1')]
    const partially = new Map([['a', dueState(TODAY)]])
    const fully = new Map([
      ['a', dueState(TODAY)],
      ['b', dueState(TODAY)],
    ])
    expect(isChapterLearned(words, partially)).toBe(false)
    expect(isChapterLearned(words, fully)).toBe(true)
  })

  it('is false for an empty chapter', () => {
    expect(isChapterLearned([], new Map())).toBe(false)
  })
})

describe('getChapterLockInfo', () => {
  it('unlocks the next chapter once the previous one is learned, but not the one after that', () => {
    const words = [makeWord('a', '1-1'), makeWord('b', '2-1'), makeWord('c', '3-1')]
    const cardStates = new Map([['a', dueState(TODAY)]]) // only chapter 1-1 learned
    const rows = getChapterLockInfo(words, cardStates)
    expect(rows.map((r) => [r.chapter, r.learned, r.locked])).toEqual([
      ['1-1', true, false], // done
      ['2-1', false, false], // unlocked — this is the one to work on next
      ['3-1', false, true], // still locked — 2-1 isn't finished yet
    ])
  })

  it('unlocks progressively as earlier chapters get learned', () => {
    const words = [makeWord('a', '1-1'), makeWord('b', '2-1')]
    const cardStates = new Map([
      ['a', dueState(TODAY)],
      ['b', dueState(TODAY)],
    ])
    const rows = getChapterLockInfo(words, cardStates)
    expect(rows.map((r) => [r.chapter, r.locked])).toEqual([
      ['1-1', false],
      ['2-1', false],
    ])
  })

  it('never locks the unsorted bucket', () => {
    const words = [makeWord('a', '1-1'), makeWord('b', null)]
    const rows = getChapterLockInfo(words, new Map())
    const unsorted = rows.find((r) => r.chapter === null)
    expect(unsorted?.locked).toBe(false)
  })

  it('puts deck1s unsorted bucket first, gating chapter 1-1 behind it', () => {
    const words = [makeWord('a', '1-1', 'deck1'), makeWord('b', null, 'deck1')]
    const rows = getChapterLockInfo(words, new Map())
    expect(rows.map((r) => r.chapter)).toEqual([null, '1-1'])
    expect(rows[0].locked).toBe(false) // unsorted itself is never locked
    expect(rows[1].locked).toBe(true) // 1-1 waits for unsorted to be learned
  })

  it('keeps other decks unsorted bucket last', () => {
    const words = [makeWord('a', '1-1', 'deck2'), makeWord('b', null, 'deck2')]
    const rows = getChapterLockInfo(words, new Map())
    expect(rows.map((r) => r.chapter)).toEqual(['1-1', null])
  })
})

describe('sampleAcrossChapters', () => {
  it('draws from every chapter instead of leaving coverage to chance', () => {
    const chapters = ['1-1', '2-1', '3-1', '4-1', '5-1']
    const words = chapters.flatMap((c) => Array.from({ length: 10 }, (_, i) => makeWord(`${c}-w${i}`, c)))
    const cardStates = new Map(words.map((w) => [w.id, dueState(TODAY)]))

    const sample = sampleAcrossChapters(words, cardStates, 15)
    const chaptersRepresented = new Set(sample.map((w) => w.chapter))
    expect(chaptersRepresented.size).toBe(5) // all 5 chapters show up, not just whichever shuffle favored
    expect(sample).toHaveLength(15)
  })

  it('excludes never-learned words', () => {
    const words = [makeWord('a', '1-1'), makeWord('b', '1-1')]
    const cardStates = new Map([['a', dueState(TODAY)]])
    const sample = sampleAcrossChapters(words, cardStates, 10)
    expect(sample.map((w) => w.id)).toEqual(['a'])
  })

  it('caps at the requested count even with more available', () => {
    const words = Array.from({ length: 50 }, (_, i) => makeWord(`w${i}`, '1-1'))
    const cardStates = new Map(words.map((w) => [w.id, dueState(TODAY)]))
    expect(sampleAcrossChapters(words, cardStates, 20)).toHaveLength(20)
  })
})

describe('buildDueQueue', () => {
  it('returns only due words when no count is given', () => {
    const words = [makeWord('a', '1-1'), makeWord('b', '1-1')]
    const cardStates = new Map([
      ['a', dueState(TODAY)],
      ['b', dueState('2099-01-01')],
    ])
    const queue = buildDueQueue(words, cardStates, { today: TODAY })
    expect(queue.map((item) => item.word.id)).toEqual(['a'])
  })

  it('caps to count, sampling when there are more due words than requested', () => {
    const words = Array.from({ length: 20 }, (_, i) => makeWord(`w${i}`, '1-1'))
    const cardStates = new Map(words.map((w) => [w.id, dueState(TODAY)]))
    const queue = buildDueQueue(words, cardStates, { today: TODAY, count: 5 })
    expect(queue).toHaveLength(5)
  })

  it('returns all due words unmodified when count exceeds availability', () => {
    const words = [makeWord('a', '1-1'), makeWord('b', '1-1')]
    const cardStates = new Map(words.map((w) => [w.id, dueState(TODAY)]))
    expect(buildDueQueue(words, cardStates, { today: TODAY, count: 10 })).toHaveLength(2)
  })
})

describe('buildRecentlyLearnedQueue', () => {
  function learnedState(learnedAt: string): CardState {
    return { easeFactor: 2.5, intervalDays: 1, repetitions: 1, dueDate: '2099-01-01', learnedAt }
  }

  it('orders words by learnedAt, most recent first', () => {
    const words = [makeWord('a', '1-1'), makeWord('b', '1-1'), makeWord('c', '1-1')]
    const cardStates = new Map([
      ['a', learnedState('2026-07-01T00:00:00.000Z')],
      ['b', learnedState('2026-07-20T00:00:00.000Z')],
      ['c', learnedState('2026-07-10T00:00:00.000Z')],
    ])
    const queue = buildRecentlyLearnedQueue(words, cardStates, 3)
    expect(queue.map((item) => item.word.id)).toEqual(['b', 'c', 'a'])
  })

  it('caps to the requested count', () => {
    const words = Array.from({ length: 10 }, (_, i) => makeWord(`w${i}`, '1-1'))
    const cardStates = new Map(
      words.map((w, i) => [w.id, learnedState(`2026-07-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`)]),
    )
    expect(buildRecentlyLearnedQueue(words, cardStates, 4)).toHaveLength(4)
  })

  it('excludes words with no learnedAt (learned before this feature shipped)', () => {
    const words = [makeWord('a', '1-1'), makeWord('b', '1-1')]
    const cardStates = new Map([
      ['a', dueState(TODAY)], // no learnedAt
      ['b', learnedState('2026-07-01T00:00:00.000Z')],
    ])
    const queue = buildRecentlyLearnedQueue(words, cardStates, 10)
    expect(queue.map((item) => item.word.id)).toEqual(['b'])
  })
})
