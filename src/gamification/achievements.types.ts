import type { Profile } from '../api/profile'
import type { DeckProgress } from '../srs/progress'

export interface AchievementContext {
  profile: Profile
  deckProgress: Record<string, DeckProgress>
  sessionStats: { correct: number; incorrect: number; isCheckpoint: boolean }
}
