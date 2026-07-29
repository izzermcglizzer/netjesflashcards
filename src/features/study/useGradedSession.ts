import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useComboFeedback } from './useComboFeedback'
import { ensureProfile } from '../../api/profile'
import { upsertCardState } from '../../api/cardState'
import { appendReviewLog } from '../../api/reviewLog'
import { scheduleReview, type Grade } from '../../srs/scheduler'
import { finalizeSession } from '../../gamification/finalizeSession'
import { checkAndUnlockAchievements } from '../../gamification/achievementRunner'
import type { MascotPose } from '../../components/Mascot'
import type { QueueItem } from '../../srs/queue'
import type { PracticeMode } from './StudyModeRenderer'
import type { DeckId } from '../../data/words.types'

// After missing a word this many times in one session, stop re-quizzing it —
// just show the answer so the user isn't stuck failing the same card on loop.
const MISSES_BEFORE_REVEAL = 2
const SKIP_REQUEUE_OFFSET = 4

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface SessionItem extends QueueItem {
  mode: PracticeMode
  missCount: number
  forceReveal: boolean
}

export function toSessionItems(items: QueueItem[], modeFor: (item: QueueItem) => PracticeMode): SessionItem[] {
  return items.map((item) => ({ ...item, mode: modeFor(item), missCount: 0, forceReveal: false }))
}

/**
 * Shared engine behind every graded practice screen (StudySessionShell,
 * QuickRecapSession, CustomPracticeSession): miss-tracking with force-reveal
 * after MISSES_BEFORE_REVEAL, skip-with-requeue, and session-completion
 * (XP/streak/achievements) — so the three screens differ only in how they
 * build their initial queue and per-item mode.
 */
export function useGradedSession(
  initialItems: SessionItem[] | null,
  opts: { userId: string; deckId: DeckId; soundEnabled: boolean },
) {
  const { userId, deckId } = opts
  const navigate = useNavigate()
  const [queue, setQueue] = useState<SessionItem[] | null>(null)
  const [index, setIndex] = useState(0)
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 })
  const [pose, setPose] = useState<MascotPose>('idle')
  const { flash, celebration, giveImmediateFeedback, registerAnswer } = useComboFeedback(opts.soundEnabled)

  useEffect(() => {
    if (initialItems) setQueue(initialItems)
  }, [initialItems])

  const current = queue ? queue[index] : null

  async function finishOrAdvance(nextQueue: SessionItem[], finalStats: { correct: number; incorrect: number }) {
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

  async function handleGraded(grade: Grade) {
    if (!queue || !current) return
    const correct = grade >= 2
    const nextState = scheduleReview(current.state, grade, todayIso())

    await Promise.all([
      upsertCardState(userId, current.word.id, deckId, nextState),
      appendReviewLog(userId, {
        wordId: current.word.id,
        deckId,
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

    let nextQueue = queue
    if (!correct) {
      const missCount = current.missCount + 1
      nextQueue = [...queue]
      const reinsertAt = Math.min(index + SKIP_REQUEUE_OFFSET, nextQueue.length)
      nextQueue.splice(reinsertAt, 0, {
        word: current.word,
        state: nextState,
        mode: current.mode,
        missCount,
        forceReveal: missCount >= MISSES_BEFORE_REVEAL,
      })
      setQueue(nextQueue)
    }

    await finishOrAdvance(nextQueue, finalStats)
  }

  /** Just show the word again — no re-grading, the misses were already recorded. */
  function handleAcknowledgeReveal() {
    if (!queue) return
    setPose('idle')
    void finishOrAdvance(queue, stats)
  }

  /** Skip: no grading, no SRS change — just come back to it a bit later in this session. */
  function handleSkip() {
    if (!queue || !current) return
    const nextQueue = [...queue]
    const reinsertAt = Math.min(index + SKIP_REQUEUE_OFFSET, nextQueue.length)
    nextQueue.splice(reinsertAt, 0, current)
    setQueue(nextQueue)
    void finishOrAdvance(nextQueue, stats)
  }

  return {
    queue,
    current,
    index,
    stats,
    pose,
    flash,
    celebration,
    giveImmediateFeedback,
    handleGraded,
    handleSkip,
    handleAcknowledgeReveal,
  }
}
