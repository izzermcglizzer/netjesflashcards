import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { getReviewLog, type ReviewLogEntry } from '../../api/reviewLog'
import { getUnlockedAchievements } from '../../api/achievements'
import { getCardStatesForDeck } from '../../api/cardState'
import { computeDeckProgress, getLearnedProgressPct, type DeckProgress } from '../../srs/progress'
import { decks, getWordsForDeck } from '../../data'
import { ACHIEVEMENTS } from '../../gamification/achievements.data'
import { AchievementBadge } from '../../components/AchievementBadge'
import { Card } from '../../components/Card'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function lastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function getFirstLearnedDates(log: ReviewLogEntry[]): Map<string, string> {
  const firstSeen = new Map<string, string>()
  for (const row of log) {
    const key = `${row.deck_id}:${row.word_id}`
    const day = row.reviewed_at.slice(0, 10)
    const existing = firstSeen.get(key)
    if (!existing || day < existing) firstSeen.set(key, day)
  }
  return firstSeen
}

export function StatsAchievements() {
  const { userId } = useAuth()
  const [reviewLog, setReviewLog] = useState<ReviewLogEntry[] | null>(null)
  const [unlocked, setUnlocked] = useState<Set<string> | null>(null)
  const [deckProgress, setDeckProgress] = useState<Record<string, DeckProgress> | null>(null)

  useEffect(() => {
    let cancelled = false
    getReviewLog(userId, 2000).then((log) => !cancelled && setReviewLog(log))
    getUnlockedAchievements(userId).then((u) => !cancelled && setUnlocked(u))
    Promise.all(decks.map((d) => getCardStatesForDeck(userId, d.id))).then((results) => {
      if (cancelled) return
      const today = todayIso()
      const map: Record<string, DeckProgress> = {}
      decks.forEach((d, i) => {
        map[d.id] = computeDeckProgress(getWordsForDeck(d.id), results[i], today)
      })
      setDeckProgress(map)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const totalReviews = reviewLog?.length ?? 0
  const totalCorrect = reviewLog?.filter((r) => r.correct).length ?? 0
  const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0
  const today = todayIso()

  const days = useMemo(() => lastNDays(7), [])
  const countsByDay = days.map((day) => reviewLog?.filter((r) => r.reviewed_at.slice(0, 10) === day).length ?? 0)
  const maxCount = Math.max(1, ...countsByDay)

  const todayReviews = reviewLog?.filter((r) => r.reviewed_at.slice(0, 10) === today) ?? []
  const todayAccuracy = todayReviews.length > 0 ? Math.round((todayReviews.filter((r) => r.correct).length / todayReviews.length) * 100) : 0

  const learnedTodayByDeck = useMemo(() => {
    const firstSeen = getFirstLearnedDates(reviewLog ?? [])
    return decks.map((deck) => ({
      deck,
      learned: [...firstSeen.entries()].filter(([key, day]) => key.startsWith(`${deck.id}:`) && day === today).length,
    }))
  }, [reviewLog, today])

  const learnedTodayTotal = learnedTodayByDeck.reduce((sum, row) => sum + row.learned, 0)

  return (
    <div className="app-page-wide flex min-h-svh flex-col gap-6">
      <Link to="/" className="font-bold text-brand-blue">
        &larr; Decks
      </Link>
      <h1 className="text-center text-2xl font-extrabold text-ink sm:text-3xl">Progress</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="text-center">
          <p className="text-2xl font-extrabold text-ink">{totalReviews}</p>
          <p className="text-xs text-ink-light">total reviews</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-extrabold text-brand-green">{accuracy}%</p>
          <p className="text-xs text-ink-light">overall accuracy</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-extrabold text-brand-blue">{todayReviews.length}</p>
          <p className="text-xs text-ink-light">reviews today</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-extrabold text-brand-purple">{learnedTodayTotal}</p>
          <p className="text-xs text-ink-light">new cards learned today</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <p className="mb-3 font-extrabold text-ink">Last 7 days</p>
          <div className="flex h-32 gap-2 sm:gap-3">
            {countsByDay.map((count, i) => (
              <div key={days[i]} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end rounded-t-lg bg-brand-green/15">
                  <div
                    className="w-full rounded-t-lg bg-brand-green"
                    style={{ height: `${Math.max((count / maxCount) * 100, count > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <p className="shrink-0 text-[10px] font-bold text-ink-light sm:text-xs">{days[i].slice(8, 10)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="mb-3 font-extrabold text-ink">Today</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-cloud px-4 py-3 text-center">
              <p className="text-xl font-extrabold text-brand-green">{todayAccuracy}%</p>
              <p className="text-xs text-ink-light">today's accuracy</p>
            </div>
            <div className="rounded-2xl bg-cloud px-4 py-3 text-center">
              <p className="text-xl font-extrabold text-brand-blue">{learnedTodayTotal}</p>
              <p className="text-xs text-ink-light">learned today</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {learnedTodayByDeck.map(({ deck, learned }) => (
              <div key={deck.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                <div>
                  <p className="font-bold text-ink">{deck.label.split(': ')[1] ?? deck.label}</p>
                  <p className="text-xs text-ink-light">Level {deck.order}</p>
                </div>
                <p className="text-lg font-extrabold text-brand-purple">{learned}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {deckProgress && (
        <Card>
          <p className="mb-3 font-extrabold text-ink">By level</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {decks.map((deck) => {
              const progress = deckProgress[deck.id]
              const pct = getLearnedProgressPct(progress)
              return (
                <div key={deck.id} className="rounded-2xl bg-cloud px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-ink">{deck.label.split(': ')[1] ?? deck.label}</p>
                      <p className="text-xs text-ink-light">Level {deck.order}</p>
                    </div>
                    <p className="text-sm font-bold text-brand-green">{pct}%</p>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-cloud-dark">
                    <div className="h-full rounded-full bg-brand-green" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-ink-light">
                    <span>{progress.studied}/{progress.total} learned</span>
                    <span>{progress.mastered} mastered</span>
                    <span>{progress.due} due</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div>
        <p className="mb-3 font-extrabold text-ink">Badges</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ACHIEVEMENTS.map((achievement) => (
            <AchievementBadge key={achievement.code} achievement={achievement} locked={!unlocked?.has(achievement.code)} />
          ))}
        </div>
      </div>
    </div>
  )
}
