export function normalizeForComparison(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function simplifyAlternate(alternate: string): string[] {
  const normalized = normalizeForComparison(alternate)
  const withoutParens = normalizeForComparison(alternate.replace(/\s*\([^)]*\)/g, ' '))
  const variants = new Set<string>([normalized, withoutParens])

  for (const candidate of [...variants]) {
    candidate
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => variants.add(part))
  }

  return [...variants].filter(Boolean)
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array<number>(b.length).fill(0),
  ])
  for (let j = 0; j <= b.length; j++) dp[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

/** Accepts an exact match after normalization, or a 1-character typo on words of 4+ letters. */
export function matchesAlternate(input: string, alternate: string): boolean {
  const a = normalizeForComparison(input)
  for (const candidate of simplifyAlternate(alternate)) {
    if (a === candidate) return true
    if (candidate.length >= 4 && levenshtein(a, candidate) <= 1) return true
  }
  return false
}

export function matchesAnyAlternate(input: string, alternates: string[]): boolean {
  return alternates.some((alt) => matchesAlternate(input, alt))
}
