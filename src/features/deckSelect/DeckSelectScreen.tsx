import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { decks, getWordsForDeck } from '../../data'
import { useAuth } from '../../auth/AuthContext'
import { getCardStatesForDeck } from '../../api/cardState'
import { ensureProfile, type Profile } from '../../api/profile'
import { getUnlockedAchievements } from '../../api/achievements'
import { computeDeckProgress, getLearnedProgressPct, type DeckProgress } from '../../srs/progress'
import { isDeckLocked } from '../../gamification/deckLock'
import { Card } from '../../components/Card'
import { Pill } from '../../components/Pill'
import { ProgressBar } from '../../components/ProgressBar'
import { ProgressRing } from '../../components/ProgressRing'
import { StatBlock } from '../../components/StatBlock'
import { ChunkyButton } from '../../components/ChunkyButton'
import { Mascot, type MascotPose } from '../../components/Mascot'
import { getLastDeckId } from '../../utils/lastDeck'
import type { DeckId } from '../../data/words.types'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const DECK_SUBTITLE: Record<string, string> = {
  deck1: 'Build your foundation with essential words and everyday expressions.',
  deck2: 'Learn natural conversations and more advanced sentence structures.',
  deck3: 'Master nuanced vocabulary, idioms, and fluent Dutch.',
}

const DECK_DIFFICULTY: Record<string, { label: string; stars: number }> = {
  deck1: { label: 'Easy', stars: 1 },
  deck2: { label: 'Medium', stars: 2 },
  deck3: { label: 'Challenging', stars: 3 },
}

const DECK_POSE: Record<string, MascotPose> = {
  deck1: 'reading',
  deck2: 'wave',
  deck3: 'thinking',
}

function chapterCount(deckId: DeckId): number {
  return new Set(getWordsForDeck(deckId).map((w) => w.chapter).filter((c): c is string => c !== null)).size
}

function DifficultyStars({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= count ? 'text-brand-gold' : 'text-cloud-dark'}>
          ★
        </span>
      ))}
    </span>
  )
}

export function DeckSelectScreen() {
  const { userId, email } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [progress, setProgress] = useState<Record<string, DeckProgress> | null>(null)
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string> | null>(null)

  useEffect(() => {
    let cancelled = false
    ensureProfile(userId).then((p) => !cancelled && setProfile(p))
    getUnlockedAchievements(userId).then((u) => !cancelled && setUnlockedAchievements(u))
    Promise.all(decks.map((d) => getCardStatesForDeck(userId, d.id))).then((results) => {
      if (cancelled) return
      const today = todayIso()
      const map: Record<string, DeckProgress> = {}
      decks.forEach((d, i) => {
        map[d.id] = computeDeckProgress(getWordsForDeck(d.id), results[i], today)
      })
      setProgress(map)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const continueDeckId = getLastDeckId()
  const rawContinueDeck = decks.find((d) => d.id === continueDeckId) ?? decks[0]
  const continueDeck =
    unlockedAchievements && isDeckLocked(rawContinueDeck.id, unlockedAchievements) ? decks[0] : rawContinueDeck
  const continueProgress = progress?.[continueDeck.id]
  const continuePct = continueProgress ? getLearnedProgressPct(continueProgress) : 0

  const totalMastered = progress ? Object.values(progress).reduce((sum, p) => sum + p.mastered, 0) : 0
  const firstName = email?.split('@')[0] ?? 'there'

  return (
    <div className="app-page flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Hi, {firstName}! 👋</h1>
          <p className="text-ink-light">Let's continue your Dutch journey!</p>
        </div>
      </div>

      <Card className="relative overflow-visible bg-brand-green/10">
        <div className="absolute -top-6 right-2">
          <Mascot pose="wave" size={76} />
        </div>
        <Pill tone="green">KEEP IT UP! 🌱</Pill>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-extrabold text-ink">{continuePct}% Complete</p>
            <p className="text-sm text-ink-light">
              Level {continueDeck.order} • {continueDeck.label.split(': ')[1] ?? continueDeck.label}
            </p>
            <ChunkyButton
              variant="primary"
              className="mt-3"
              onClick={() => navigate(`/deck/${continueDeck.id}`)}
            >
              Continue →
            </ChunkyButton>
          </div>
          <ProgressRing pct={continuePct} size={88}>
            <div className="text-center">
              <p className="text-lg font-extrabold text-brand-green">{continuePct}%</p>
              <p className="text-[10px] text-ink-light">Progress</p>
            </div>
          </ProgressRing>
        </div>
      </Card>

      <h2 className="app-section-title">Choose Your Deck 🌷</h2>

      <div className="flex flex-col gap-4">
        {decks.map((deck, i) => {
          const p = progress?.[deck.id]
          const pct = p ? getLearnedProgressPct(p) : 0
          const difficulty = DECK_DIFFICULTY[deck.id]
          const locked = unlockedAchievements !== null && isDeckLocked(deck.id, unlockedAchievements)
          const prevDeck = decks.find((d) => d.order === deck.order - 1)
          return (
            <motion.button
              key={deck.id}
              type="button"
              onClick={() => !locked && navigate(`/deck/${deck.id}`)}
              disabled={locked}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 26 }}
              whileTap={locked ? undefined : { scale: 0.98 }}
              className={`app-card text-left ${locked ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              <div className="flex items-start gap-3">
                <p
                  className={`text-3xl font-extrabold ${locked ? 'text-cloud-dark' : 'text-brand-green/40'}`}
                >
                  {String(deck.order).padStart(2, '0')}
                </p>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold text-ink">{deck.label.split(': ')[1] ?? deck.label}</p>
                    <Pill tone={locked ? 'neutral' : 'green'}>
                      <DifficultyStars count={difficulty.stars} /> {difficulty.label}
                    </Pill>
                  </div>
                  <p className="mt-1 text-sm text-ink-light">{DECK_SUBTITLE[deck.id]}</p>
                  {locked ? (
                    <p className="mt-2 text-xs font-bold text-ink-light">
                      🔒 Pass {prevDeck?.label.split(': ')[1] ?? 'the previous level'}'s Rank-Up Exam to unlock
                    </p>
                  ) : (
                    <>
                      <div className="mt-2">
                        <ProgressBar pct={pct} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="font-bold text-brand-green">{p ? `${p.due} due today` : '...'}</span>
                        <span className="text-ink-light">{pct}%</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <Mascot pose={locked ? 'locked' : DECK_POSE[deck.id]} size={56} />
                  <div className="text-center text-[11px] text-ink-light">
                    <p className="font-bold text-ink">{deck.noteCount}</p>
                    <p>words</p>
                  </div>
                  <div className="text-center text-[11px] text-ink-light">
                    <p className="font-bold text-ink">{chapterCount(deck.id)}</p>
                    <p>chapters</p>
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      <Card className="flex items-center justify-around">
        <StatBlock icon="🔥" value={profile?.streak ?? 0} label="Day streak" valueClassName="text-brand-gold-dark" />
        <StatBlock icon="🎯" value={totalMastered} label="Words mastered" valueClassName="text-brand-green" />
        <StatBlock icon="⭐" value={profile?.xp ?? 0} label="Total XP" valueClassName="text-brand-blue" />
      </Card>
    </div>
  )
}
