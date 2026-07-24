import { describe, expect, it } from 'vitest'
import { computeSessionXp, levelForXp, xpToNextLevel } from './xp'

describe('xp math', () => {
  it('levels up every 100 xp', () => {
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(99)).toBe(1)
    expect(levelForXp(100)).toBe(2)
    expect(levelForXp(250)).toBe(3)
  })

  it('reports xp remaining to next level', () => {
    expect(xpToNextLevel(580)).toBe(20)
  })

  it('computes session xp with the regular bonus', () => {
    expect(computeSessionXp(8, 2, false)).toBe(8 * 10 + 2 * 2 + 20)
  })

  it('checkpoint sessions get a bigger completion bonus', () => {
    expect(computeSessionXp(8, 2, true)).toBe(8 * 10 + 2 * 2 + 50)
  })
})
