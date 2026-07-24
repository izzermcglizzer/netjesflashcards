export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Picks distractors that are plausible next to `correct` — similar length/shape —
 * instead of pure-random picks that can be trivially obvious (e.g. a number or a
 * long parenthetical next to a single short word).
 */
export function pickDistractors(correct: string, pool: string[], count: number): string[] {
  const target = correct.length
  const byCloseness = [...pool].sort(
    (a, b) => Math.abs(a.length - target) - Math.abs(b.length - target),
  )
  const candidatePoolSize = Math.min(byCloseness.length, Math.max(count * 4, 12))
  return shuffle(byCloseness.slice(0, candidatePoolSize)).slice(0, count)
}
