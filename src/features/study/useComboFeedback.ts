import { useState } from 'react'
import confetti from 'canvas-confetti'
import { playCorrectSound, playIncorrectSound, playWinSound } from '../../utils/sound'

const COMBO_MILESTONES = [3, 5, 10, 15, 20, 25, 30]

export function useComboFeedback(soundEnabled: boolean) {
  const [flash, setFlash] = useState<'correct' | 'incorrect' | null>(null)
  const [, setCombo] = useState(0)
  const [celebration, setCelebration] = useState<number | null>(null)

  function giveImmediateFeedback(correct: boolean) {
    setFlash(correct ? 'correct' : 'incorrect')
    setTimeout(() => setFlash(null), 400)

    if (soundEnabled) {
      if (correct) playCorrectSound()
      else playIncorrectSound()
    }
  }

  function registerAnswer(correct: boolean, opts?: { skipFeedback?: boolean }) {
    if (!opts?.skipFeedback) giveImmediateFeedback(correct)

    setCombo((prev) => {
      const next = correct ? prev + 1 : 0
      if (correct && COMBO_MILESTONES.includes(next)) {
        setCelebration(next)
        if (soundEnabled) playWinSound()
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.4 } })
        setTimeout(() => setCelebration(null), 1800)
      }
      return next
    })
  }

  return { flash, celebration, giveImmediateFeedback, registerAnswer }
}
