export const XP_CORRECT = 10
export const XP_INCORRECT = 2
export const XP_SESSION_BONUS = 20
export const XP_CHECKPOINT_BONUS = 50
const XP_PER_LEVEL = 100

export function levelForXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export function xpIntoCurrentLevel(xp: number): number {
  return xp % XP_PER_LEVEL
}

export function xpToNextLevel(xp: number): number {
  return XP_PER_LEVEL - xpIntoCurrentLevel(xp)
}

export function computeSessionXp(correctCount: number, incorrectCount: number, isCheckpoint = false): number {
  const bonus = isCheckpoint ? XP_CHECKPOINT_BONUS : XP_SESSION_BONUS
  return correctCount * XP_CORRECT + incorrectCount * XP_INCORRECT + bonus
}
