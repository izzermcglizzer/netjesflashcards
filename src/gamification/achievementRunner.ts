import { decks, getWordsForDeck } from '../data'
import { getCardStatesForDeck } from '../api/cardState'
import { getUnlockedAchievements, unlockAchievement } from '../api/achievements'
import { computeDeckProgress, type DeckProgress } from '../srs/progress'
import { evaluateAchievements } from './achievements.logic'
import { ACHIEVEMENTS, type Achievement } from './achievements.data'
import type { Profile } from '../api/profile'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function checkAndUnlockAchievements(
  userId: string,
  profile: Profile,
  sessionStats: { correct: number; incorrect: number; isCheckpoint: boolean },
): Promise<Achievement[]> {
  const today = todayIso()

  const [deckProgressEntries, alreadyUnlocked] = await Promise.all([
    Promise.all(
      decks.map(async (d): Promise<[string, DeckProgress]> => {
        const cardStates = await getCardStatesForDeck(userId, d.id)
        return [d.id, computeDeckProgress(getWordsForDeck(d.id), cardStates, today)]
      }),
    ),
    getUnlockedAchievements(userId),
  ])

  const deckProgress = Object.fromEntries(deckProgressEntries)
  const newlyUnlockedCodes = evaluateAchievements({ profile, deckProgress, sessionStats }, alreadyUnlocked)

  await Promise.all(newlyUnlockedCodes.map((code) => unlockAchievement(userId, code)))

  return ACHIEVEMENTS.filter((a) => newlyUnlockedCodes.includes(a.code))
}
