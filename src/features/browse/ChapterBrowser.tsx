import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getWordsForDeck, decks } from '../../data'
import { useAuth } from '../../auth/AuthContext'
import { getCardStatesForDeck } from '../../api/cardState'
import { computeDeckProgress, getLearnedProgressPct, type DeckProgress } from '../../srs/progress'
import { getChapterLockInfo, type ChapterLockInfo } from '../../srs/queue'
import { Card } from '../../components/Card'
import { ProgressBar } from '../../components/ProgressBar'
import { Mascot } from '../../components/Mascot'
import type { CardState } from '../../srs/scheduler'
import type { DeckId } from '../../data/words.types'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ChapterBrowser() {
  const { deckId } = useParams<{ deckId: string }>()
  const { userId } = useAuth()
  const navigate = useNavigate()
  const deck = decks.find((d) => d.id === deckId)
  const words = useMemo(() => getWordsForDeck(deckId as DeckId), [deckId])
  const [cardStates, setCardStates] = useState<Map<string, CardState> | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    getCardStatesForDeck(userId, deckId as DeckId).then((cs) => {
      if (!cancelled) setCardStates(cs)
    })
    return () => {
      cancelled = true
    }
  }, [userId, deckId])

  if (!deck || cardStates === null) return null

  const rows = getChapterLockInfo(words, cardStates)
  const overall = computeDeckProgress(words, cardStates, todayIso())

  function progressFor(chapterWords: typeof words): DeckProgress {
    return computeDeckProgress(chapterWords, cardStates!, todayIso())
  }

  function handleChapterClick(row: ChapterLockInfo) {
    if (row.locked) return
    const chapterParam = row.chapter ?? '__unsorted__'
    if (row.learned) {
      navigate(`/deck/${deckId}/study/classic?chapter=${chapterParam}`)
    } else {
      navigate(`/deck/${deckId}/learn?chapter=${chapterParam}`)
    }
  }

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="app-page flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link to={`/deck/${deckId}`} className="font-bold text-brand-blue">
          &larr; Level {deck.order} • {deck.label.split(': ')[1] ?? deck.label}
        </Link>
        <Mascot pose="idle" size={40} />
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-ink">Browse by chapter</h1>
        <p className="text-ink-light">Learn step by step and build your foundation.</p>
      </div>

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-light">Your progress</p>
          <p className="text-xl font-extrabold text-brand-green">{getLearnedProgressPct(overall)}% learned</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/stats')}
          className="app-pill bg-cloud text-ink shadow-sm"
        >
          📊 View stats
        </button>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="app-section-title">Chapters</h2>
        <span className="text-sm font-bold text-ink-light">Sequential ▾</span>
      </div>

      <div className="flex flex-col">
        {rows.map((row, i) => {
          const key = row.chapter ?? 'unsorted'
          const p = progressFor(row.words)
          const pct = getLearnedProgressPct(p)
          const isLast = i === rows.length - 1
          const label = row.chapter ? `Chapter ${row.chapter}` : 'Unsorted'
          const isExpanded = expanded.has(key)
          const sortedWords = [...row.words].sort((a, b) => a.english.localeCompare(b.english))

          return (
            <div key={key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                    row.locked
                      ? 'bg-cloud-dark text-ink-light'
                      : row.learned
                        ? 'bg-brand-green/15 text-brand-green-dark'
                        : 'bg-brand-blue/15 text-brand-blue-dark'
                  }`}
                >
                  {row.locked ? '🔒' : (row.chapter ?? '—')}
                </div>
                {!isLast && <div className="my-1 w-0.5 flex-1 border-l-2 border-dashed border-cloud-dark" />}
              </div>
              <div className={`app-card mb-4 flex-1 ${row.locked ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleChapterClick(row)}
                    disabled={row.locked}
                    className={`flex flex-1 items-center justify-between text-left ${
                      row.locked ? 'cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-extrabold text-ink">{label}</p>
                      {row.locked ? (
                        <p className="text-sm text-ink-light">Finish the previous chapter to unlock</p>
                      ) : (
                        <>
                          <p className="text-sm text-ink-light">
                            {p.studied} / {p.total} learned
                            {!row.learned && ' · not fully learned yet'}
                          </p>
                          <div className="mt-2">
                            <ProgressBar pct={pct} />
                          </div>
                        </>
                      )}
                    </div>
                    {!row.locked && <span className="ml-3 text-xl text-ink-light">›</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExpand(key)}
                    aria-label={isExpanded ? 'Hide words' : 'Show words'}
                    className="shrink-0 rounded-full bg-cloud px-2 py-1 text-xs font-bold text-ink-light"
                  >
                    {isExpanded ? '▲ words' : '▼ words'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 max-h-56 overflow-y-auto rounded-xl bg-cloud p-2">
                    <ul className="flex flex-col gap-1">
                      {sortedWords.map((w) => {
                        const learned = cardStates?.has(w.id) ?? false
                        return (
                          <li key={w.id} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1 text-sm">
                            <span className={learned ? 'text-brand-green' : 'text-ink-light'}>
                              {learned ? '✓' : '○'}
                            </span>
                            <span className="font-bold text-ink">{w.english}</span>
                            <span className="text-ink-light">→</span>
                            <span className="text-brand-blue">{w.dutch}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
