import { describe, expect, it } from 'vitest'
import { matchesAnyAlternate } from './text'

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

  it('rejects unrelated answers', () => {
    expect(matchesAnyAlternate('kat', ['huis'])).toBe(false)
  })

  it('does not tolerate typos on very short words', () => {
    expect(matchesAnyAlternate('de', ['het'])).toBe(false)
  })
})
