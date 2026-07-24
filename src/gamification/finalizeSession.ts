import { computeSessionXp, levelForXp } from './xp'
import { updateStreak } from './streak'
import { updateProfile, type Profile } from '../api/profile'

export interface SessionResult {
  profile: Profile
  xpEarned: number
  leveledUp: boolean
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function finalizeSession(
  userId: string,
  profile: Profile,
  correctCount: number,
  incorrectCount: number,
  isCheckpoint = false,
): Promise<SessionResult> {
  const xpEarned = computeSessionXp(correctCount, incorrectCount, isCheckpoint)
  const newXp = profile.xp + xpEarned
  const newLevel = levelForXp(newXp)
  const today = todayIso()

  const streakState = updateStreak(
    { streak: profile.streak, longestStreak: profile.longest_streak, lastStudyDate: profile.last_study_date },
    today,
  )

  const updated = await updateProfile(userId, {
    xp: newXp,
    level: newLevel,
    streak: streakState.streak,
    longest_streak: streakState.longestStreak,
    last_study_date: streakState.lastStudyDate,
  })

  return { profile: updated, xpEarned, leveledUp: newLevel > profile.level }
}
