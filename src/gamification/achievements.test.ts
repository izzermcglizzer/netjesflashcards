import { describe, expect, it } from 'vitest'
import { evaluateAchievements } from './achievements.logic'
import type { AchievementContext } from './achievements.types'
import type { Profile } from '../api/profile'

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    user_id: 'u1',
    xp: 0,
    level: 1,
    streak: 0,
    longest_streak: 0,
    last_study_date: null,
    daily_goal: 20,
    new_cards_per_day: 10,
    sound_enabled: true,
    ...overrides,
  }
}

describe('evaluateAchievements', () => {
  it('unlocks a streak milestone once reached', () => {
    const ctx: AchievementContext = {
      profile: makeProfile({ streak: 3 }),
      deckProgress: {},
      sessionStats: { correct: 0, incorrect: 0, isCheckpoint: false },
    }
    expect(evaluateAchievements(ctx, new Set())).toContain('streak_3')
  })

  it('does not re-unlock an already-unlocked achievement', () => {
    const ctx: AchievementContext = {
      profile: makeProfile({ streak: 3 }),
      deckProgress: {},
      sessionStats: { correct: 0, incorrect: 0, isCheckpoint: false },
    }
    expect(evaluateAchievements(ctx, new Set(['streak_3']))).not.toContain('streak_3')
  })

  it('unlocks deck-complete when a deck is fully mastered', () => {
    const ctx: AchievementContext = {
      profile: makeProfile(),
      deckProgress: { deck1: { total: 500, studied: 500, mastered: 500, due: 0 } },
      sessionStats: { correct: 0, incorrect: 0, isCheckpoint: false },
    }
    expect(evaluateAchievements(ctx, new Set())).toContain('deck1_complete')
  })

  it('unlocks perfect_session only for a mistake-free regular session of 5+', () => {
    const ctx: AchievementContext = {
      profile: makeProfile(),
      deckProgress: {},
      sessionStats: { correct: 5, incorrect: 0, isCheckpoint: false },
    }
    expect(evaluateAchievements(ctx, new Set())).toContain('perfect_session')

    const tooShort: AchievementContext = { ...ctx, sessionStats: { correct: 4, incorrect: 0, isCheckpoint: false } }
    expect(evaluateAchievements(tooShort, new Set())).not.toContain('perfect_session')
  })

  it('unlocks checkpoint_ace only for checkpoint sessions scoring 90%+', () => {
    const ctx: AchievementContext = {
      profile: makeProfile(),
      deckProgress: {},
      sessionStats: { correct: 18, incorrect: 2, isCheckpoint: true },
    }
    expect(evaluateAchievements(ctx, new Set())).toContain('checkpoint_ace')

    const regularSession: AchievementContext = { ...ctx, sessionStats: { ...ctx.sessionStats, isCheckpoint: false } }
    expect(evaluateAchievements(regularSession, new Set())).not.toContain('checkpoint_ace')
  })
})
