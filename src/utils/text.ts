export function normalizeForComparison(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function extractAnswerCandidates(answer: string): string[] {
  const normalized = normalizeForComparison(answer)
  const beforeParen = normalizeForComparison(answer.split('(')[0] ?? '')
  const withoutParens = normalizeForComparison(answer.replace(/\s*\([^)]*\)/g, ' '))
  const variants = new Set<string>([normalized, beforeParen, withoutParens])

  for (const candidate of [beforeParen, withoutParens]) {
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

export type MatchResult = 'exact' | 'typo' | 'none'

export function matchAlternate(input: string, alternate: string): MatchResult {
  const a = normalizeForComparison(input)
  for (const candidate of extractAnswerCandidates(alternate)) {
    if (a === candidate) return 'exact'
  }
  for (const candidate of extractAnswerCandidates(alternate)) {
    if (candidate.length >= 4 && levenshtein(a, candidate) <= 1) return 'typo'
  }
  return 'none'
}

export function matchesAnyAlternate(input: string, alternates: string[]): boolean {
  return alternates.some((alt) => matchAlternate(input, alt) !== 'none')
}

export function getBestMatch(input: string, alternates: string[]): MatchResult {
  let sawTypo = false
  for (const alternate of alternates) {
    const result = matchAlternate(input, alternate)
    if (result === 'exact') return 'exact'
    if (result === 'typo') sawTypo = true
  }
  return sawTypo ? 'typo' : 'none'
}
