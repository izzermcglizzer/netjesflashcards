import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../auth/AuthContext'
import { ensureProfile, type Profile } from '../../api/profile'
import { getCardStatesForDeck } from '../../api/cardState'
import { getUnlockedAchievements } from '../../api/achievements'
import { computeDeckProgress, type DeckProgress } from '../../srs/progress'
import { isDeckLocked } from '../../gamification/deckLock'
import { getWordsForDeck, decks } from '../../data'
import { Card } from '../../components/Card'
import { Pill } from '../../components/Pill'
import { StatBlock } from '../../components/StatBlock'
import { ChunkyButton } from '../../components/ChunkyButton'
import { Mascot, type MascotPose } from '../../components/Mascot'
import { setLastDeckId } from '../../utils/lastDeck'
import { xpIntoCurrentLevel, xpToNextLevel } from '../../gamification/xp'
import type { DeckId } from '../../data/words.types'

const MODES: { id: string; label: string; subtitle: string; icon: string; pose: MascotPose }[] = [
  { id: 'classic', label: 'Flip Cards', subtitle: 'Review words and meanings', icon: '🗂️', pose: 'reading' },
  { id: 'multipleChoice', label: 'Multiple Choice', subtitle: 'Test your knowledge', icon: '✅', pose: 'thinking' },
  { id: 'typing', label: 'Type It', subtitle: "Type what you've learned", icon: '⌨️', pose: 'typing' },
  { id: 'listening', label: 'Listening', subtitle: 'Listen and understand', icon: '🎧', pose: 'headphones' },
]

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function ActionRow({
  icon,
  label,
  subtitle,
  pose,
  onClick,
  disabled,
  iconBg = 'bg-brand-green/10',
}: {
  icon: string
  label: string
  subtitle: string
  pose?: MascotPose
  onClick: () => void
  disabled?: boolean
  iconBg?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`app-card flex w-full items-center gap-3 text-left ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <span className={`app-icon-badge h-10 w-10 text-xl ${iconBg}`}>{icon}</span>
      <div className="flex-1">
        <p className="font-extrabold text-ink">{label}</p>
        <p className="text-sm text-ink-light">{subtitle}</p>
      </div>
      {pose && <Mascot pose={pose} size={48} />}
      {!disabled && <span className="text-xl text-ink-light">›</span>}
    </button>
  )
}

export function HomeDashboard() {
  const { deckId } = useParams<{ deckId: string }>()
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [progress, setProgress] = useState<DeckProgress | null>(null)
  const [locked, setLocked] = useState<boolean | null>(null)
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [practiceCount, setPracticeCount] = useState(1)

  const deck = decks.find((d) => d.id === deckId)

  useEffect(() => {
    if (deckId) setLastDeckId(deckId)
  }, [deckId])

  useEffect(() => {
    let cancelled = false
    ensureProfile(userId).then((p) => !cancelled && setProfile(p))
    getUnlockedAchievements(userId).then((u) => !cancelled && setLocked(isDeckLocked(deckId as DeckId, u)))
    getCardStatesForDeck(userId, deckId as DeckId).then((cardStates) => {
      if (cancelled) return
      setProgress(computeDeckProgress(getWordsForDeck(deckId as DeckId), cardStates, todayIso()))
    })
    return () => {
      cancelled = true
    }
  }, [userId, deckId])

  useEffect(() => {
    if (!progress) return
    setPracticeCount((current) => {
      if (progress.studied <= 0) return 1
      const suggested = Math.min(10, progress.studied)
      return current > progress.studied ? progress.studied : current < 1 ? suggested : current
    })
  }, [progress])

  function handleSelectMode(modeId: string) {
    if ((progress?.studied ?? 0) === 0) return
    setSelectedMode((current) => (current === modeId ? null : modeId))
  }

  function startSpecificPractice() {
    if (!selectedMode || !deckId || !progress || progress.studied === 0) return
    navigate(`/deck/${deckId}/study/${selectedMode}?count=${Math.min(practiceCount, progress.studied)}`)
  }

  if (!deck) return null

  if (locked) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <Mascot pose="locked" size={120} />
        <h1 className="text-xl font-bold text-ink">This level is locked</h1>
        <p className="text-ink-light">Pass the previous level's Rank-Up Exam to unlock {deck.label}.</p>
        <Link to="/" className="font-bold text-brand-blue underline">
          Back to Decks
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <span className="app-icon-badge h-9 w-9 bg-white text-lg shadow-sm">🔔</span>
        <Link to="/stats" className="app-pill bg-white text-ink shadow-sm">
          📊 Stats
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Pill tone="green">
            LEVEL {deck.order} • {(deck.label.split(': ')[1] ?? deck.label).toUpperCase()}
          </Pill>
          <h1 className="mt-2 text-3xl font-extrabold text-ink">Let's learn Dutch! 🌷</h1>
          <p className="mt-1 text-ink-light">You've got this! Every lesson brings you closer.</p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <Mascot pose="wave" size={100} />
        </motion.div>
      </div>

      {profile && (
        <Card className="flex items-stretch">
          <div className="flex flex-1 justify-center border-r-2 border-cloud-dark pr-4">
            <StatBlock icon="🔥" value={profile.streak} label="Day streak" valueClassName="text-brand-gold-dark" />
          </div>
          <div className="flex flex-1 justify-center border-r-2 border-cloud-dark px-4">
            <StatBlock icon="⭐" value={profile.xp} label="Total XP" valueClassName="text-brand-blue" />
          </div>
          <div className="flex flex-1 justify-center pl-4">
            <StatBlock
              icon=""
              value={`Lvl ${profile.level}`}
              label={`${xpIntoCurrentLevel(profile.xp)}/${xpIntoCurrentLevel(profile.xp) + xpToNextLevel(profile.xp)} XP`}
              valueClassName="text-brand-green"
            />
          </div>
        </Card>
      )}

      {progress && (
        <p className="text-center text-ink-light">
          {progress.due} due &middot; {progress.studied}/{progress.total} learned &middot; {progress.mastered}/
          {progress.total} mastered
        </p>
      )}

      <div>
        <ChunkyButton
          variant="primary"
          fullWidth
          className="py-5 text-lg"
          onClick={() => navigate(`/deck/${deckId}/quick-recap`)}
        >
          ⚡ Quick Recap
        </ChunkyButton>
        <p className="mt-2 text-center text-sm text-ink-light">
          Mixed test — flip cards, typing, listening &amp; more — of everything you've learned
        </p>
      </div>

      <div>
        <ActionRow
          icon="📚"
          label="Learn New Words"
          subtitle="Add new words before practicing them"
          pose="reading"
          iconBg="bg-brand-blue/10"
          onClick={() => navigate(`/deck/${deckId}/learn`)}
        />
      </div>

      <div>
        <h2 className="app-section-title mb-3">Practice a specific skill</h2>
        <p className="mb-3 -mt-2 text-xs text-ink-light">Only words you've already learned show up here.</p>
        <div className="flex flex-col gap-3">
          {MODES.map((m) => (
            <div key={m.id} className="flex flex-col gap-3">
              <ActionRow
                icon={m.icon}
                label={m.label}
                subtitle={selectedMode === m.id ? `Selected • ${m.subtitle}` : m.subtitle}
                pose={m.pose}
                onClick={() => handleSelectMode(m.id)}
                disabled={(progress?.studied ?? 0) === 0}
              />

              {progress && progress.studied > 0 && selectedMode === m.id && (
                <Card className="space-y-4 bg-brand-purple/8">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-ink">Choose how many learned cards to practice</p>
                      <p className="text-sm text-ink-light">
                        You have {progress.studied} learned cards in this level. Practice any amount up to all of them.
                      </p>
                    </div>
                    <Pill tone="purple">{practiceCount} cards</Pill>
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={progress.studied}
                    step={1}
                    value={practiceCount}
                    onChange={(e) => setPracticeCount(Number(e.target.value))}
                    className="w-full accent-[var(--color-brand-purple)]"
                  />

                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 20, progress.studied].map((count, i) => {
                      const value = Math.min(count, progress.studied)
                      const label = i === 3 ? 'All' : String(value)
                      return (
                        <button
                          key={`${label}-${value}`}
                          type="button"
                          onClick={() => setPracticeCount(value)}
                          className={`rounded-xl border-2 px-3 py-2 text-sm font-extrabold ${
                            practiceCount === value
                              ? 'border-brand-purple bg-brand-purple text-white'
                              : 'border-cloud-dark bg-white text-ink'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>

                  <ChunkyButton variant="purple" fullWidth onClick={startSpecificPractice}>
                    Start {m.label}
                  </ChunkyButton>
                </Card>
              )}
            </div>
          ))}

          {progress &&
            (progress.total > 0 && progress.studied === progress.total ? (
              <ActionRow
                icon="⚠️"
                label="Rank-Up Exam"
                subtitle="Score 80%+ to advance to the next level"
                pose="happy"
                iconBg="bg-brand-gold/20"
                onClick={() => navigate(`/deck/${deckId}/rank-up`)}
              />
            ) : (
              <ActionRow
                icon="🔒"
                label="Rank-Up Exam"
                subtitle="Learn every word in this level to unlock"
                disabled
                onClick={() => {}}
              />
            ))}

          <ActionRow
            icon="📖"
            label="Browse by Chapter"
            subtitle="Jump into a specific topic"
            onClick={() => navigate(`/deck/${deckId}/browse`)}
          />
        </div>
      </div>
    </div>
  )
}
