import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { getWordsForDeck } from '../../data'
import { getCardStatesForDeck, upsertCardState } from '../../api/cardState'
import { appendReviewLog } from '../../api/reviewLog'
import { ensureProfile, type Profile } from '../../api/profile'
import { scheduleReview, type Grade } from '../../srs/scheduler'
import { buildQueue, type QueueItem } from '../../srs/queue'
import { finalizeSession } from '../../gamification/finalizeSession'
import { checkAndUnlockAchievements } from '../../gamification/achievementRunner'
import { StudyModeRenderer, type PracticeMode } from './StudyModeRenderer'
import { useComboFeedback } from './useComboFeedback'
import { Mascot, type MascotPose } from '../../components/Mascot'
import { FlashOverlay } from '../../components/FlashOverlay'
import { ComboBanner } from '../../components/ComboBanner'
import { ProgressBar } from '../../components/ProgressBar'
import { Pill } from '../../components/Pill'
import { shuffle } from '../../utils/array'
import type { DeckId } from '../../data/words.types'

const MODES: PracticeMode[] = ['classic', 'multipleChoice', 'typing', 'listening']

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

interface SessionItem {
  item: QueueItem
  mode: PracticeMode
}

/**
 * Quick Recap: a mixed-format review of every already-learned word that's due
 * across the WHOLE deck (not scoped to one chapter) — flip cards, multiple
 * choice, typing, and listening all shuffled together. Never teaches anything
 * new; that's exclusively Learn New Words' job.
 */
export function QuickRecapSession() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [items, setItems] = useState<SessionItem[] | null>(null)
  const [index, setIndex] = useState(0)
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 })
  const [pose, setPose] = useState<MascotPose>('idle')
  const { flash, celebration, giveImmediateFeedback, registerAnswer } = useComboFeedback(profile?.sound_enabled ?? true)

  const deckWords = useMemo(() => getWordsForDeck(deckId as DeckId), [deckId])

  useEffect(() => {
    ensureProfile(userId).then(setProfile)
  }, [userId])

  useEffect(() => {
    let cancelled = false
    getCardStatesForDeck(userId, deckId as DeckId).then((cardStates) => {
      if (cancelled) return
      const due = buildQueue(deckWords, cardStates, { today: todayIso() })
      setItems(shuffle(due).map((item) => ({ item, mode: shuffle(MODES)[0] })))
    })
    return () => {
      cancelled = true
    }
  }, [userId, deckId, deckWords])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [index])

  if (!profile || items === null) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-ink-light">Loading...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <Mascot pose="happy" />
        <p className="text-xl font-bold">All caught up! Nothing due to recap right now.</p>
        <button
          type="button"
          onClick={() => navigate(`/deck/${deckId}/learn`)}
          className="font-bold text-brand-blue underline"
        >
          Learn some new words instead →
        </button>
        <button
          type="button"
          onClick={() => navigate(`/deck/${deckId}`)}
          className="text-sm text-ink-light underline"
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  const current = items[index]

  async function handleGraded(grade: Grade) {
    if (!items) return
    const correct = grade >= 2
    const nextState = scheduleReview(current.item.state, grade, todayIso())

    await Promise.all([
      upsertCardState(userId, current.item.word.id, deckId as DeckId, nextState),
      appendReviewLog(userId, {
        wordId: current.item.word.id,
        deckId: deckId as DeckId,
        mode: current.mode,
        grade,
        correct,
      }),
    ])

    const finalStats = correct
      ? { correct: stats.correct + 1, incorrect: stats.incorrect }
      : { correct: stats.correct, incorrect: stats.incorrect + 1 }
    setStats(finalStats)
    setPose(correct ? 'happy' : 'sad')
    registerAnswer(correct)

    let nextItems = items
    if (!correct) {
      nextItems = [...items]
      const reinsertAt = Math.min(index + 4, nextItems.length)
      nextItems.splice(reinsertAt, 0, { item: { word: current.item.word, state: nextState }, mode: current.mode })
      setItems(nextItems)
    }

    if (index + 1 >= nextItems.length) {
      const freshProfile = await ensureProfile(userId)
      const result = await finalizeSession(userId, freshProfile, finalStats.correct, finalStats.incorrect)
      const newAchievements = await checkAndUnlockAchievements(userId, result.profile, {
        correct: finalStats.correct,
        incorrect: finalStats.incorrect,
        isCheckpoint: false,
      })
      navigate(`/deck/${deckId}/summary`, {
        state: {
          correct: finalStats.correct,
          incorrect: finalStats.incorrect,
          xpEarned: result.xpEarned,
          leveledUp: result.leveledUp,
          newAchievements,
        },
      })
    } else {
      setIndex((i) => i + 1)
      setTimeout(() => setPose('idle'), 700)
    }
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 p-6">
      <FlashOverlay flash={flash} />
      <ComboBanner count={celebration} />

      <div className="mx-auto flex w-full max-w-md items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/deck/${deckId}`)}
          aria-label="Close session"
          className="text-2xl leading-none text-ink-light"
        >
          ×
        </button>
        <ProgressBar pct={(index / items.length) * 100} colorClassName="bg-brand-green" />
      </div>

      <div className="mx-auto flex w-full max-w-md items-center gap-3">
        <Mascot pose={pose} size={64} />
        <div>
          <Pill tone="green">⚡ QUICK RECAP</Pill>
          <p className="mt-1 font-extrabold text-ink">
            Question {index + 1} of {items.length}
          </p>
        </div>
      </div>

      <StudyModeRenderer
        mode={current.mode}
        word={current.item.word}
        deckWords={deckWords}
        onGraded={handleGraded}
        onAnswerFeedback={giveImmediateFeedback}
      />
    </div>
  )
}
