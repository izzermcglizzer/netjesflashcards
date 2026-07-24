import { describe, expect, it } from 'vitest'
import { getLearnedProgressPct, getMasteredProgressPct } from './progress'

describe('progress percentages', () => {
  it('calculates learned progress from studied cards', () => {
    expect(getLearnedProgressPct({ total: 500, studied: 70, mastered: 0, due: 0 })).toBe(14)
  })

  it('calculates mastered progress separately', () => {
    expect(getMasteredProgressPct({ total: 500, studied: 70, mastered: 21, due: 0 })).toBe(4)
  })

  it('returns 0 for empty decks', () => {
    expect(getLearnedProgressPct({ total: 0, studied: 0, mastered: 0, due: 0 })).toBe(0)
  })
})
