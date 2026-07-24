import { describe, expect, it } from 'vitest'
import { updateStreak } from './streak'

describe('updateStreak', () => {
  it('starts a streak at 1 for a brand new profile', () => {
    const result = updateStreak({ streak: 0, longestStreak: 0, lastStudyDate: null }, '2026-07-24')
    expect(result).toEqual({ streak: 1, longestStreak: 1, lastStudyDate: '2026-07-24' })
  })

  it('increments when studied yesterday', () => {
    const result = updateStreak(
      { streak: 5, longestStreak: 5, lastStudyDate: '2026-07-23' },
      '2026-07-24',
    )
    expect(result.streak).toBe(6)
    expect(result.longestStreak).toBe(6)
  })

  it('resets to 1 after a gap of more than a day', () => {
    const result = updateStreak(
      { streak: 12, longestStreak: 14, lastStudyDate: '2026-07-20' },
      '2026-07-24',
    )
    expect(result.streak).toBe(1)
    expect(result.longestStreak).toBe(14) // longest streak is preserved
  })

  it('is idempotent for repeated study on the same day', () => {
    const first = updateStreak({ streak: 3, longestStreak: 3, lastStudyDate: '2026-07-23' }, '2026-07-24')
    const second = updateStreak(first, '2026-07-24')
    expect(second).toEqual(first)
  })
})
