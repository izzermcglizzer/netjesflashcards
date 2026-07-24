export type Grade = 0 | 1 | 2 | 3 // Again, Hard, Good, Easy

export interface CardState {
  easeFactor: number
  intervalDays: number
  repetitions: number
  dueDate: string // ISO date, yyyy-mm-dd
}

const MIN_EASE = 1.3
const EASE_DELTA: Record<Grade, number> = { 0: -0.2, 1: -0.15, 2: 0, 3: 0.15 }

export function newCardState(today: string): CardState {
  return { easeFactor: 2.5, intervalDays: 0, repetitions: 0, dueDate: today }
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function scheduleReview(state: CardState, grade: Grade, today: string): CardState {
  if (grade === 0) {
    return {
      easeFactor: Math.max(MIN_EASE, state.easeFactor + EASE_DELTA[0]),
      intervalDays: 1,
      repetitions: 0,
      dueDate: addDays(today, 1),
    }
  }

  const repetitions = state.repetitions + 1
  const intervalDays =
    repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(state.intervalDays * state.easeFactor)
  const easeFactor = Math.max(MIN_EASE, state.easeFactor + EASE_DELTA[grade])

  return { easeFactor, intervalDays, repetitions, dueDate: addDays(today, intervalDays) }
}
