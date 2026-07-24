import { describe, expect, it } from 'vitest'
import { newCardState, scheduleReview } from './scheduler'

const TODAY = '2026-07-24'

describe('scheduleReview', () => {
  it('starts a new card immediately due today', () => {
    const state = newCardState(TODAY)
    expect(state.dueDate).toBe(TODAY)
    expect(state.repetitions).toBe(0)
  })

  it('Again resets repetitions and reschedules for tomorrow', () => {
    const state = { easeFactor: 2.5, intervalDays: 6, repetitions: 2, dueDate: TODAY }
    const next = scheduleReview(state, 0, TODAY)
    expect(next.repetitions).toBe(0)
    expect(next.intervalDays).toBe(1)
    expect(next.dueDate).toBe('2026-07-25')
    expect(next.easeFactor).toBeCloseTo(2.3)
  })

  it('Again never drops ease below the floor', () => {
    const state = { easeFactor: 1.35, intervalDays: 1, repetitions: 0, dueDate: TODAY }
    const next = scheduleReview(state, 0, TODAY)
    expect(next.easeFactor).toBe(1.3)
  })

  it('first Good graduates to a 1-day interval', () => {
    const state = newCardState(TODAY)
    const next = scheduleReview(state, 2, TODAY)
    expect(next.repetitions).toBe(1)
    expect(next.intervalDays).toBe(1)
    expect(next.dueDate).toBe('2026-07-25')
  })

  it('second Good graduates to a 6-day interval', () => {
    const state = scheduleReview(newCardState(TODAY), 2, TODAY)
    const next = scheduleReview(state, 2, TODAY)
    expect(next.repetitions).toBe(2)
    expect(next.intervalDays).toBe(6)
  })

  it('subsequent Good grows interval by ease factor', () => {
    let state = scheduleReview(newCardState(TODAY), 2, TODAY)
    state = scheduleReview(state, 2, TODAY)
    const next = scheduleReview(state, 2, TODAY)
    expect(next.repetitions).toBe(3)
    expect(next.intervalDays).toBe(Math.round(6 * state.easeFactor))
  })

  it('Easy grows ease and interval more than Good', () => {
    let goodState = scheduleReview(newCardState(TODAY), 2, TODAY)
    goodState = scheduleReview(goodState, 2, TODAY)
    let easyState = scheduleReview(newCardState(TODAY), 3, TODAY)
    easyState = scheduleReview(easyState, 3, TODAY)
    expect(easyState.easeFactor).toBeGreaterThan(goodState.easeFactor)
  })

  it('Hard shrinks ease relative to Good', () => {
    const hard = scheduleReview(newCardState(TODAY), 1, TODAY)
    const good = scheduleReview(newCardState(TODAY), 2, TODAY)
    expect(hard.easeFactor).toBeLessThan(good.easeFactor)
  })
})
