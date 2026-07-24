import { ACHIEVEMENTS } from './achievements.data'
import type { AchievementContext } from './achievements.types'

export function evaluateAchievements(ctx: AchievementContext, alreadyUnlocked: Set<string>): string[] {
  return ACHIEVEMENTS.filter((a) => !alreadyUnlocked.has(a.code) && a.isUnlocked(ctx)).map((a) => a.code)
}
