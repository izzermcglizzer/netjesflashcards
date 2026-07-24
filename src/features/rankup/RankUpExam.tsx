import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { decks, getWordsForDeck } from '../../data'
import { getCardStatesForDeck, upsertCardState } from '../../api/cardState'
import { appendReviewLog } from '../../api/reviewLog'
import { ensureProfile } from '../../api/profile'
import { unlockAchievement } from '../../api/achievements'
import { scheduleReview, type CardState, type Grade } from '../../srs/scheduler'
import { isChapterLearned, sampleAcrossChapters } from '../../srs/queue'
import { finalizeSession } from '../../gamification/finalizeSession'
import { checkAndUnlockAchievements } from '../../gamification/achievementRunner'
import { rankUpAchievementCode } from '../../gamification/deckLock'
import { StudyModeRenderer, type PracticeMode } from '../study/StudyModeRenderer'
import { useComboFeedback } from '../study/useComboFeedback'
import { Mascot, type MascotPose } from '../../components/Mascot'
import { ChunkyButton } from '../../components/ChunkyButton'
import { FlashOverlay } from '../../components/FlashOverlay'
import { ComboBanner } from '../../components/ComboBanner'
import { ProgressBar } from '../../components/ProgressBar'
import { shuffle } from '../../utils/array'
import type { DeckId, Word } from '../../data/words.types'

export const RANK_UP_PASS_PCT = 80
const EXAM_QUESTION_COUNT = 100
const MODES: PracticeMode[] = ['classic', 'multipleChoice', 'typing', 'listening']

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface ExamItem {
  word: Word
  state: CardState
  mode: PracticeMode
}

export function RankUpExam() {
  const { deckId } = useParams<{ deckId: string }>()
  const { userId } = useAuth()
  const navigate = useNavigate()
  const deck = decks.find((d) => d.id === deckId)
  const nextDeck = deck ? decks.find((d) => d.order === deck.order + 1) : undefined

  const [eligible, setEligible] = useState<boolean | null>(null)
  const [phase, setPhase] = useState<'intro' | 'exam'>('intro')
  const [items, setItems] = useState<ExamItem[] | null>(null)
  const [index, setIndex] = useState(0)
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 })
  const [pose, setPose] = useState<MascotPose>('idle')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const { flash, celebration, registerAnswer } = useComboFeedback(soundEnabled)

  const deckWords = useMemo(() => getWordsForDeck(deckId as DeckId), [deckId])

  useEffect(() => {
    ensureProfile(userId).then((p) => setSoundEnabled(p.sound_enabled))
  }, [userId])

  useEffect(() => {
    let cancelled = false
    getCardStatesForDeck(userId, deckId as DeckId).then((cardStates) => {
      if (cancelled) return
      setEligible(isChapterLearned(deckWords, cardStates))
      const sample = sampleAcrossChapters(deckWords, cardStates, EXAM_QUESTION_COUNT)
      setItems(sample.map((word) => ({ word, state: cardStates.get(word.id)!, mode: shuffle(MODES)[0] })))
    })
    return () => {
      cancelled = true
    }
  }, [userId, deckId, deckWords])

  useEffect(() => {
    if (phase !== 'exam') return
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [phase])

  if (!deck || eligible === null || items === null) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-ink">
        <p className="text-cloud">Loading...</p>
      </div>
    )
  }

  if (!eligible) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <Mascot pose="thinking" />
        <p className="text-xl font-bold">Learn every word in this level before taking the Rank-Up Exam.</p>
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

  if (phase === 'intro') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-ink p-6 text-center">
        <p className="text-4xl">⚠️</p>
        <h1 className="text-3xl font-extrabold tracking-wide text-brand-gold uppercase">Rank-Up Exam</h1>
        <p className="max-w-sm text-cloud">
          Score <span className="font-extrabold text-brand-gold">{RANK_UP_PASS_PCT}%+</span> to advance from{' '}
          <span className="font-extrabold">{deck.label}</span>
          {nextDeck ? (
            <>
              {' '}
              to <span className="font-extrabold">{nextDeck.label}</span>
            </>
          ) : null}
          .
        </p>
        <p className="text-sm text-cloud-dark">{items.length} questions &middot; mixed formats &middot; no do-overs mid-exam</p>
        <ChunkyButton variant="danger" onClick={() => setPhase('exam')}>
          Begin Exam
        </ChunkyButton>
        <button
          type="button"
          onClick={() => navigate(`/deck/${deckId}`)}
          className="text-sm font-bold text-cloud underline"
        >
          Not ready yet
        </button>
      </div>
    )
  }

  const current = items[index]
  const totalItems = items.length

  async function handleGraded(grade: Grade) {
    const correct = grade >= 2
    const nextState = scheduleReview(current.state, grade, todayIso())

    await Promise.all([
      upsertCardState(userId, current.word.id, deckId as DeckId, nextState),
      appendReviewLog(userId, {
        wordId: current.word.id,
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

    if (index + 1 >= totalItems) {
      const profile = await ensureProfile(userId)
      const result = await finalizeSession(userId, profile, finalStats.correct, finalStats.incorrect, true)
      const newAchievements = await checkAndUnlockAchievements(userId, result.profile, {
        correct: finalStats.correct,
        incorrect: finalStats.incorrect,
        isCheckpoint: true,
      })
      const pct = Math.round((finalStats.correct / totalItems) * 100)
      const passed = pct >= RANK_UP_PASS_PCT
      if (passed) {
        await unlockAchievement(userId, rankUpAchievementCode(deckId as DeckId))
      }
      navigate(`/deck/${deckId}/rank-up/result`, {
        state: {
          correct: finalStats.correct,
          incorrect: finalStats.incorrect,
          xpEarned: result.xpEarned,
          leveledUp: result.leveledUp,
          newAchievements,
          passed,
          nextDeckLabel: nextDeck?.label ?? null,
        },
      })
    } else {
      setIndex((i) => i + 1)
      setTimeout(() => setPose('idle'), 700)
    }
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-ink p-6">
      <FlashOverlay flash={flash} />
      <ComboBanner count={celebration} />

      <div className="mx-auto flex w-full max-w-md items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/deck/${deckId}`)}
          aria-label="Close exam"
          className="text-2xl leading-none text-cloud"
        >
          ×
        </button>
        <ProgressBar pct={(index / totalItems) * 100} colorClassName="bg-brand-gold" />
        <span className="shrink-0 font-mono text-sm font-bold text-cloud">{formatElapsed(elapsed)}</span>
      </div>

      <div className="mx-auto flex w-full max-w-md items-center gap-3">
        <Mascot pose={pose} size={64} />
        <div>
          <p className="app-pill bg-brand-gold/20 text-brand-gold uppercase">⚠️ Rank-Up Exam</p>
          <p className="mt-1 font-extrabold text-cloud">
            Question {index + 1} of {totalItems}
          </p>
        </div>
      </div>

      <StudyModeRenderer mode={current.mode} word={current.word} deckWords={deckWords} onGraded={handleGraded} />
    </div>
  )
}
