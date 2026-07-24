import { supabase } from '../lib/supabaseClient'
import type { DeckId } from '../data/words.types'
import type { Grade } from '../srs/scheduler'

export type StudyMode = 'classic' | 'multipleChoice' | 'typing' | 'listening' | 'checkpoint'

export interface ReviewLogEntry {
  id: number
  word_id: string
  deck_id: DeckId
  mode: StudyMode
  grade: Grade
  correct: boolean
  reviewed_at: string
}

export async function appendReviewLog(
  userId: string,
  entry: { wordId: string; deckId: DeckId; mode: StudyMode; grade: Grade; correct: boolean },
): Promise<void> {
  const { error } = await supabase.from('review_log').insert({
    user_id: userId,
    word_id: entry.wordId,
    deck_id: entry.deckId,
    mode: entry.mode,
    grade: entry.grade,
    correct: entry.correct,
  })
  if (error) throw error
}

export async function getReviewLog(userId: string, limit = 200): Promise<ReviewLogEntry[]> {
  const { data, error } = await supabase
    .from('review_log')
    .select('*')
    .eq('user_id', userId)
    .order('reviewed_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as ReviewLogEntry[]
}
