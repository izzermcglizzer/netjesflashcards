import type { AchievementContext } from './achievements.types'

export interface Achievement {
  code: string
  label: string
  description: string
  icon: string
  isUnlocked: (ctx: AchievementContext) => boolean
}

function totalMastered(ctx: AchievementContext): number {
  return Object.values(ctx.deckProgress).reduce((sum, p) => sum + p.mastered, 0)
}

function isDeckComplete(ctx: AchievementContext, deckId: string): boolean {
  const p = ctx.deckProgress[deckId]
  return !!p && p.total > 0 && p.mastered >= p.total
}

function isExamAce(ctx: AchievementContext): boolean {
  const { correct, incorrect, isCheckpoint } = ctx.sessionStats
  const total = correct + incorrect
  return isCheckpoint && total > 0 && correct / total >= 0.9
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    code: 'streak_3',
    label: 'Getting Started',
    description: 'Reach a 3-day streak',
    icon: '🔥',
    isUnlocked: (ctx) => ctx.profile.streak >= 3,
  },
  {
    code: 'streak_7',
    label: 'Week Warrior',
    description: 'Reach a 7-day streak',
    icon: '🔥',
    isUnlocked: (ctx) => ctx.profile.streak >= 7,
  },
  {
    code: 'streak_30',
    label: 'Streak King',
    description: 'Reach a 30-day streak',
    icon: '👑',
    isUnlocked: (ctx) => ctx.profile.streak >= 30,
  },
  {
    code: 'level_5',
    label: 'Rising Star',
    description: 'Reach level 5',
    icon: '⭐',
    isUnlocked: (ctx) => ctx.profile.level >= 5,
  },
  {
    code: 'level_10',
    label: 'Dutch Enthusiast',
    description: 'Reach level 10',
    icon: '🌟',
    isUnlocked: (ctx) => ctx.profile.level >= 10,
  },
  {
    code: 'mastered_50',
    label: 'Word Collector',
    description: 'Master 50 words',
    icon: '📚',
    isUnlocked: (ctx) => totalMastered(ctx) >= 50,
  },
  {
    code: 'mastered_200',
    label: 'Vocabulary Master',
    description: 'Master 200 words',
    icon: '🏆',
    isUnlocked: (ctx) => totalMastered(ctx) >= 200,
  },
  {
    code: 'mastered_500',
    label: 'Wordsmith',
    description: 'Master 500 words',
    icon: '💎',
    isUnlocked: (ctx) => totalMastered(ctx) >= 500,
  },
  {
    code: 'deck1_complete',
    label: 'Basics Champion',
    description: 'Master every word in Level 1',
    icon: '🥉',
    isUnlocked: (ctx) => isDeckComplete(ctx, 'deck1'),
  },
  {
    code: 'deck2_complete',
    label: 'Everyday Champion',
    description: 'Master every word in Level 2',
    icon: '🥈',
    isUnlocked: (ctx) => isDeckComplete(ctx, 'deck2'),
  },
  {
    code: 'deck3_complete',
    label: 'Advanced Champion',
    description: 'Master every word in Level 3',
    icon: '🥇',
    isUnlocked: (ctx) => isDeckComplete(ctx, 'deck3'),
  },
  {
    code: 'perfect_session',
    label: 'Flawless',
    description: 'Finish a session with no mistakes',
    icon: '✨',
    isUnlocked: (ctx) =>
      !ctx.sessionStats.isCheckpoint && ctx.sessionStats.incorrect === 0 && ctx.sessionStats.correct >= 5,
  },
  {
    code: 'checkpoint_ace',
    label: 'Exam Ace',
    description: 'Score 90%+ on a Rank-Up Exam',
    icon: '🎯',
    isUnlocked: isExamAce,
  },
  {
    // Unlocked directly by RankUpExam on an 80%+ pass, not by the generic
    // evaluator — this predicate never fires on its own, it's just here so
    // the badge shows up (locked/unlocked) in the Stats grid.
    code: 'deck1_rankup_passed',
    label: 'Ranked Up!',
    description: 'Passed the Level 1 Rank-Up Exam',
    icon: '🏅',
    isUnlocked: () => false,
  },
  {
    code: 'deck2_rankup_passed',
    label: 'Ranked Up Again!',
    description: 'Passed the Level 2 Rank-Up Exam',
    icon: '🏆',
    isUnlocked: () => false,
  },
]
