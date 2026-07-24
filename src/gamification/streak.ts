export interface StreakState {
  streak: number
  longestStreak: number
  lastStudyDate: string | null
}

function isoYesterday(today: string): string {
  const d = new Date(`${today}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** Call once per completed session/checkpoint that met the daily goal. */
export function updateStreak(state: StreakState, today: string): StreakState {
  if (state.lastStudyDate === today) return state // already counted today

  const streak = state.lastStudyDate === isoYesterday(today) ? state.streak + 1 : 1

  return {
    streak,
    longestStreak: Math.max(state.longestStreak, streak),
    lastStudyDate: today,
  }
}
