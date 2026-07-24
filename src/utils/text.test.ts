import { describe, expect, it } from 'vitest'
import { getBestMatch, matchesAnyAlternate } from './text'

describe('matchesAnyAlternate', () => {
  it('accepts any of multiple alternates', () => {
    expect(matchesAnyAlternate('hoi', ['hoi', 'hallo'])).toBe(true)
    expect(matchesAnyAlternate('hallo', ['hoi', 'hallo'])).toBe(true)
    expect(matchesAnyAlternate('het', ['de', 'het'])).toBe(true)
  })

  it('is case and diacritic insensitive', () => {
    expect(matchesAnyAlternate('HALLO', ['hallo'])).toBe(true)
    expect(matchesAnyAlternate('cafe', ['café'])).toBe(true)
  })

  it('tolerates a single-character typo on longer words', () => {
    expect(matchesAnyAlternate('goedemorgn', ['goedemorgen'])).toBe(true)
  })

  it('accepts the main word without parenthetical notes', () => {
    expect(matchesAnyAlternate('vies', ['vies (nasty/dirty)'])).toBe(true)
  })

  it('accepts answers when malformed alternates still have the right leading term', () => {
    expect(matchesAnyAlternate('rustig', ['rustig (quiet', 'calm)'])).toBe(true)
  })

  it('returns typo when the answer is close enough', () => {
    expect(getBestMatch('ruztig', ['rustig (quiet / calm)'])).toBe('typo')
  })

  it('rejects parenthetical translation words as answers', () => {
    expect(matchesAnyAlternate('calm', ['rustig (quiet / calm)'])).toBe(false)
    expect(matchesAnyAlternate('quiet', ['rustig (quiet / calm)'])).toBe(false)
  })

  it('rejects unrelated answers', () => {
    expect(matchesAnyAlternate('kat', ['huis'])).toBe(false)
  })

  it('does not tolerate typos on very short words', () => {
    expect(matchesAnyAlternate('de', ['het'])).toBe(false)
  })
})
