import { supabase } from '../lib/supabaseClient'
import type { CardState } from '../srs/scheduler'
import type { DeckId } from '../data/words.types'

interface CardStateRow {
  word_id: string
  deck_id: string
  ease_factor: number
  interval_days: number
  repetitions: number
  due_date: string
  last_reviewed_at: string | null
}

function rowToState(row: CardStateRow): CardState {
  return {
    easeFactor: row.ease_factor,
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    dueDate: row.due_date,
  }
}

export async function getCardStatesForDeck(userId: string, deckId: DeckId): Promise<Map<string, CardState>> {
  const { data, error } = await supabase
    .from('card_state')
    .select('word_id, deck_id, ease_factor, interval_days, repetitions, due_date, last_reviewed_at')
    .eq('user_id', userId)
    .eq('deck_id', deckId)
  if (error) throw error

  return new Map((data as CardStateRow[]).map((row) => [row.word_id, rowToState(row)]))
}

export async function upsertCardState(
  userId: string,
  wordId: string,
  deckId: DeckId,
  state: CardState,
): Promise<void> {
  const { error } = await supabase.from('card_state').upsert({
    user_id: userId,
    word_id: wordId,
    deck_id: deckId,
    ease_factor: state.easeFactor,
    interval_days: state.intervalDays,
    repetitions: state.repetitions,
    due_date: state.dueDate,
    last_reviewed_at: new Date().toISOString(),
  })
  if (error) throw error
}
