import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ensureProfile } from '../../api/profile'
import { getCardStatesForDeck } from '../../api/cardState'
import { computeDeckProgress, type DeckProgress } from '../../srs/progress'
import { getWordsForDeck, decks } from '../../data'
import { Card } from '../../components/Card'
import { Pill } from '../../components/Pill'
import { Toggle } from '../../components/Toggle'
import { ChunkyButton } from '../../components/ChunkyButton'
import { Mascot, type MascotPose } from '../../components/Mascot'
import type { PracticeMode } from '../study/StudyModeRenderer'
import type { PracticeSource } from './customPractice.types'
import type { DeckId } from '../../data/words.types'

const MODES: { id: PracticeMode; label: string; subtitle: string; icon: string; pose: MascotPose }[] = [
  { id: 'classic', label: 'Flip Cards', subtitle: 'Review words and meanings', icon: '🗂️', pose: 'reading' },
  { id: 'multipleChoice', label: 'Multiple Choice', subtitle: 'Test your knowledge', icon: '✅', pose: 'thinking' },
  { id: 'typing', label: 'Type It', subtitle: "Type what you've learned", icon: '⌨️', pose: 'typing' },
  { id: 'listening', label: 'Listening', subtitle: 'Listen and understand', icon: '🎧', pose: 'headphones' },
]

const DUE_QUICK_PICKS = [5, 10, 20]
const RECENT_QUICK_PICKS = [20, 30, 40, 50]

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function CustomPracticeSetup() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const { userId } = useAuth()
  const deck = decks.find((d) => d.id === deckId)
  const [progress, setProgress] = useState<DeckProgress | null>(null)
  const [selectedModes, setSelectedModes] = useState<PracticeMode[]>(['classic'])
  const [source, setSource] = useState<PracticeSource>('due')
  const [count, setCount] = useState(10)

  useEffect(() => {
    ensureProfile(userId)
  }, [userId])

  useEffect(() => {
    let cancelled = false
    getCardStatesForDeck(userId, deckId as DeckId).then((cardStates) => {
      if (cancelled) return
      const p = computeDeckProgress(getWordsForDeck(deckId as DeckId), cardStates, todayIso())
      setProgress(p)
      setCount((current) => (current > p.studied ? Math.max(1, Math.min(10, p.studied)) : current))
    })
    return () => {
      cancelled = true
    }
  }, [userId, deckId])

  function toggleMode(modeId: PracticeMode) {
    setSelectedModes((current) =>
      current.includes(modeId) ? current.filter((m) => m !== modeId) : [...current, modeId],
    )
  }

  function start() {
    if (selectedModes.length === 0 || !deckId) return
    const params = new URLSearchParams({
      modes: selectedModes.join(','),
      source,
      count: String(count),
    })
    navigate(`/deck/${deckId}/custom-practice/session?${params.toString()}`)
  }

  if (!deck) return null

  const quickPicks = source === 'recent' ? RECENT_QUICK_PICKS : DUE_QUICK_PICKS
  const maxCount = progress?.studied ?? 1

  return (
    <div className="app-page flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link to={`/deck/${deckId}`} className="font-bold text-brand-blue">
          &larr; Level {deck.order} • {deck.label.split(': ')[1] ?? deck.label}
        </Link>
        <Mascot pose="idle" size={40} />
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-ink">🎯 Custom Practice</h1>
        <p className="text-ink-light">Pick your modes and how many cards to study.</p>
      </div>

      {progress && progress.studied === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <Mascot pose="reading" size={72} />
          <p className="font-extrabold text-ink">Learn some words first</p>
          <p className="text-sm text-ink-light">
            You need at least one learned word in this level before you can build a custom session.
          </p>
          <ChunkyButton variant="primary" onClick={() => navigate(`/deck/${deckId}/learn`)}>
            Learn New Words
          </ChunkyButton>
        </Card>
      ) : (
        <>
          <div>
            <h2 className="app-section-title mb-3">Which modes?</h2>
            <div className="flex flex-col gap-2">
              {MODES.map((m) => {
                const selected = selectedModes.includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMode(m.id)}
                    className={`app-card flex w-full items-center gap-3 text-left ${
                      selected ? 'border-brand-purple bg-brand-purple/8' : ''
                    }`}
                  >
                    <span
                      className={`app-icon-badge h-10 w-10 text-xl ${selected ? 'bg-brand-purple/15' : 'bg-cloud'}`}
                    >
                      {m.icon}
                    </span>
                    <div className="flex-1">
                      <p className="font-extrabold text-ink">{m.label}</p>
                      <p className="text-sm text-ink-light">{m.subtitle}</p>
                    </div>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                        selected ? 'bg-brand-purple text-white' : 'border-2 border-cloud-dark text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <Card className="flex items-center justify-between gap-3">
            <div>
              <p className="font-extrabold text-ink">
                {source === 'recent' ? 'Last words I learned' : 'All due words'}
              </p>
              <p className="text-sm text-ink-light">
                {source === 'recent'
                  ? "Drill just the newest words you've learned, ignoring what's due today"
                  : "Practice from what's due for review today"}
              </p>
            </div>
            <Toggle checked={source === 'recent'} onChange={(checked) => setSource(checked ? 'recent' : 'due')} />
          </Card>

          <Card className="space-y-4 bg-brand-purple/8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-extrabold text-ink">How many cards?</p>
                <p className="text-sm text-ink-light">You have {progress?.studied ?? 0} learned cards in this level.</p>
              </div>
              <Pill tone="purple">{count} cards</Pill>
            </div>

            <input
              type="range"
              min={1}
              max={Math.max(1, maxCount)}
              step={1}
              value={Math.min(count, Math.max(1, maxCount))}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-[var(--color-brand-purple)]"
            />

            <div className="grid grid-cols-4 gap-2">
              {quickPicks.map((pick) => {
                const value = Math.min(pick, Math.max(1, maxCount))
                return (
                  <button
                    key={pick}
                    type="button"
                    onClick={() => setCount(value)}
                    className={`rounded-xl border-2 px-3 py-2 text-sm font-extrabold ${
                      count === value ? 'border-brand-purple bg-brand-purple text-white' : 'border-cloud-dark bg-white text-ink'
                    }`}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </Card>

          <ChunkyButton variant="purple" fullWidth disabled={selectedModes.length === 0} onClick={start}>
            Start Custom Practice
          </ChunkyButton>
        </>
      )}
    </div>
  )
}
