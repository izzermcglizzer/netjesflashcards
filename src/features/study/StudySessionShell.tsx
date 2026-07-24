import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useStudyQueue } from './useStudyQueue'
import { useComboFeedback } from './useComboFeedback'
import { ensureProfile, type Profile } from '../../api/profile'
import { upsertCardState } from '../../api/cardState'
import { appendReviewLog, type StudyMode } from '../../api/reviewLog'
import { scheduleReview, type Grade } from '../../srs/scheduler'
import { finalizeSession } from '../../gamification/finalizeSession'
import { checkAndUnlockAchievements } from '../../gamification/achievementRunner'
import { StudyModeRenderer } from './StudyModeRenderer'
import { Mascot, type MascotPose } from '../../components/Mascot'
import { FlashOverlay } from '../../components/FlashOverlay'
import { ComboBanner } from '../../components/ComboBanner'
import { ProgressBar } from '../../components/ProgressBar'
import { Pill } from '../../components/Pill'
import { getWordsForDeck, decks } from '../../data'
import type { QueueItem } from '../../srs/queue'
import type { DeckId } from '../../data/words.types'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function StudySessionShell() {
  const { deckId, mode } = useParams<{ deckId: string; mode: string }>()
  const [searchParams] = useSearchParams()
  const chapterFilter = searchParams.has('chapter')
    ? searchParams.get('chapter') === '__unsorted__'
      ? null
      : searchParams.get('chapter')
    : undefined
  const practiceCountParam = searchParams.get('count')
  const practiceCount = practiceCountParam ? Number.parseInt(practiceCountParam, 10) : null
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    ensureProfile(userId).then(setProfile)
  }, [userId])

  const { items, loading, error } = useStudyQueue(userId, deckId as DeckId, { chapterFilter, practiceCount })
  const [queue, setQueue] = useState<QueueItem[] | null>(null)
  const [index, setIndex] = useState(0)
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 })
  const [pose, setPose] = useState<MascotPose>('idle')
  const { flash, celebration, giveImmediateFeedback, registerAnswer } = useComboFeedback(profile?.sound_enabled ?? true)

  useEffect(() => {
    if (items) setQueue(items)
  }, [items])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [index])

  if (loading || profile === null || queue === null) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-ink-light">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-brand-red">{error}</p>
      </div>
    )
  }

  if (queue.length === 0) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <Mascot pose="happy" />
        <p className="text-xl font-bold">All caught up! No cards due right now.</p>
        <button
          type="button"
          onClick={() => navigate(`/deck/${deckId}`)}
          className="font-bold text-brand-blue underline"
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  const current = queue[index]

  async function handleGraded(grade: Grade) {
    const correct = grade >= 2
    const nextState = scheduleReview(current.state, grade, todayIso())

    await Promise.all([
      upsertCardState(userId, current.word.id, deckId as DeckId, nextState),
      appendReviewLog(userId, {
        wordId: current.word.id,
        deckId: deckId as DeckId,
        mode: (mode as StudyMode) ?? 'classic',
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

    let nextQueue = queue!
    if (!correct) {
      nextQueue = [...queue!]
      const reinsertAt = Math.min(index + 4, nextQueue.length)
      nextQueue.splice(reinsertAt, 0, { word: current.word, state: nextState })
      setQueue(nextQueue)
    }

    if (index + 1 >= nextQueue.length) {
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

  const deck = decks.find((d) => d.id === deckId)

  return (
    <div className="flex min-h-svh flex-col">
      <FlashOverlay flash={flash} />
      <ComboBanner count={celebration} />

      <div className="mx-auto flex w-full max-w-md shrink-0 items-center gap-3 px-6 pt-6">
        <button
          type="button"
          onClick={() => navigate(`/deck/${deckId}`)}
          aria-label="Close session"
          className="text-2xl leading-none text-ink-light"
        >
          ×
        </button>
        <ProgressBar pct={(index / queue.length) * 100} />
      </div>

      <div className="mx-auto flex w-full max-w-md shrink-0 items-center gap-3 px-6 pt-4">
        <Mascot pose={pose} size={56} />
        <div>
          {deck && (
            <Pill tone="green">
              LEVEL {deck.order} • {(deck.label.split(': ')[1] ?? deck.label).toUpperCase()}
            </Pill>
          )}
          <p className="mt-1 font-extrabold text-ink">
            Question {index + 1} of {queue.length}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
        <StudyModeRenderer
          mode={mode}
          word={current.word}
          deckWords={getWordsForDeck(deckId as DeckId)}
          onGraded={handleGraded}
          onAnswerFeedback={giveImmediateFeedback}
        />
      </div>
    </div>
  )
}
