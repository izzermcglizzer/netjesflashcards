import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { Mascot } from '../../components/Mascot'
import { ChunkyButton } from '../../components/ChunkyButton'
import { AchievementBadge } from '../../components/AchievementBadge'
import { playLevelUpSound } from '../../utils/sound'
import type { Achievement } from '../../gamification/achievements.data'

interface SummaryState {
  correct: number
  incorrect: number
  xpEarned: number
  leveledUp: boolean
  newAchievements?: Achievement[]
}

export function SessionSummary() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as SummaryState | null

  useEffect(() => {
    if (!state) {
      navigate(`/deck/${deckId}`, { replace: true })
      return
    }
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } })
    if (state.leveledUp) playLevelUpSound()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!state) return null

  const total = state.correct + state.incorrect
  const accuracy = total > 0 ? Math.round((state.correct / total) * 100) : 0

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <Mascot pose="happy" size={140} />
      <h1 className="text-3xl font-extrabold text-brand-green">Geweldig!</h1>
      <p className="text-ink-light">You finished this session.</p>

      <div className="flex gap-8">
        <div>
          <p className="text-2xl font-extrabold text-ink">{total}</p>
          <p className="text-xs text-ink-light">cards</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold text-brand-green">{accuracy}%</p>
          <p className="text-xs text-ink-light">accuracy</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold text-brand-gold">+{state.xpEarned}</p>
          <p className="text-xs text-ink-light">XP</p>
        </div>
      </div>

      {state.leveledUp && <p className="font-extrabold text-brand-blue">Level up! 🎉</p>}

      {state.newAchievements && state.newAchievements.length > 0 && (
        <div className="w-full">
          <p className="mb-2 font-extrabold text-ink">New badges!</p>
          <div className="flex flex-wrap justify-center gap-3">
            {state.newAchievements.map((a) => (
              <AchievementBadge key={a.code} achievement={a} />
            ))}
          </div>
        </div>
      )}

      <ChunkyButton variant="primary" onClick={() => navigate(`/deck/${deckId}`)}>
        Continue
      </ChunkyButton>
    </div>
  )
}
