import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { Mascot } from '../../components/Mascot'
import { ChunkyButton } from '../../components/ChunkyButton'
import { AchievementBadge } from '../../components/AchievementBadge'
import { playWinSound, playIncorrectSound } from '../../utils/sound'
import { RANK_UP_PASS_PCT } from './RankUpExam'
import type { Achievement } from '../../gamification/achievements.data'

interface RankUpResultState {
  correct: number
  incorrect: number
  xpEarned: number
  leveledUp: boolean
  newAchievements?: Achievement[]
  passed: boolean
  nextDeckLabel: string | null
}

export function RankUpResult() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as RankUpResultState | null

  useEffect(() => {
    if (!state) {
      navigate(`/deck/${deckId}`, { replace: true })
      return
    }
    if (state.passed) {
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } })
      playWinSound()
    } else {
      playIncorrectSound()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!state) return null

  const total = state.correct + state.incorrect
  const pct = total > 0 ? Math.round((state.correct / total) * 100) : 0

  return (
    <div
      className={`mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-6 p-6 text-center ${
        state.passed ? '' : 'bg-ink'
      }`}
    >
      <p
        className={`text-sm font-extrabold uppercase tracking-wide ${
          state.passed ? 'text-brand-gold-dark' : 'text-cloud'
        }`}
      >
        {state.passed ? 'Exam passed!' : 'Exam not passed'}
      </p>
      <Mascot pose={state.passed ? 'happy' : 'sad'} size={140} />
      <h1 className={`text-3xl font-extrabold ${state.passed ? 'text-brand-gold-dark' : 'text-cloud'}`}>
        {state.passed ? '🎉 RANKED UP! 🎉' : 'Not quite there yet'}
      </h1>

      <div
        className={`flex h-32 w-32 items-center justify-center rounded-full border-8 text-3xl font-extrabold ${
          state.passed ? 'border-brand-gold text-brand-gold-dark' : 'border-brand-red text-brand-red'
        }`}
      >
        {pct}%
      </div>

      <p className={state.passed ? 'text-ink-light' : 'text-cloud-dark'}>
        {state.passed
          ? state.nextDeckLabel
            ? `You've unlocked ${state.nextDeckLabel}!`
            : "You've mastered every level!"
          : `You need ${RANK_UP_PASS_PCT}%+ to rank up — review the words you missed and try again.`}
      </p>

      <div className="flex gap-8">
        <div>
          <p className={`text-2xl font-extrabold ${state.passed ? 'text-ink' : 'text-cloud'}`}>{total}</p>
          <p className={`text-xs ${state.passed ? 'text-ink-light' : 'text-cloud-dark'}`}>questions</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold text-brand-green">{state.correct}</p>
          <p className={`text-xs ${state.passed ? 'text-ink-light' : 'text-cloud-dark'}`}>correct</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold text-brand-gold">+{state.xpEarned}</p>
          <p className={`text-xs ${state.passed ? 'text-ink-light' : 'text-cloud-dark'}`}>XP</p>
        </div>
      </div>

      {state.leveledUp && <p className="font-extrabold text-brand-blue">Level up! 🎉</p>}

      {state.newAchievements && state.newAchievements.length > 0 && (
        <div className="w-full">
          <p className={`mb-2 font-extrabold ${state.passed ? 'text-ink' : 'text-cloud'}`}>New badges!</p>
          <div className="flex flex-wrap justify-center gap-3">
            {state.newAchievements.map((a) => (
              <AchievementBadge key={a.code} achievement={a} />
            ))}
          </div>
        </div>
      )}

      <ChunkyButton variant={state.passed ? 'primary' : 'danger'} onClick={() => navigate(`/deck/${deckId}`)}>
        {state.passed ? 'Continue' : 'Back to Dashboard'}
      </ChunkyButton>
    </div>
  )
}
