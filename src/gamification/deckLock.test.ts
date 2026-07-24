import { describe, expect, it } from 'vitest'
import { isDeckLocked, rankUpAchievementCode } from './deckLock'

describe('isDeckLocked', () => {
  it('deck1 is never locked', () => {
    expect(isDeckLocked('deck1', new Set())).toBe(false)
  })

  it('deck2 is locked until deck1 rank-up is passed', () => {
    expect(isDeckLocked('deck2', new Set())).toBe(true)
    expect(isDeckLocked('deck2', new Set([rankUpAchievementCode('deck1')]))).toBe(false)
  })

  it('deck3 requires deck2 rank-up, not deck1', () => {
    const onlyDeck1 = new Set([rankUpAchievementCode('deck1')])
    expect(isDeckLocked('deck3', onlyDeck1)).toBe(true)
    expect(isDeckLocked('deck3', new Set([rankUpAchievementCode('deck2')]))).toBe(false)
  })
})
