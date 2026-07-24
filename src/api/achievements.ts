import { supabase } from '../lib/supabaseClient'

export async function getUnlockedAchievements(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from('achievement').select('code').eq('user_id', userId)
  if (error) throw error
  return new Set(data.map((row) => row.code))
}

export async function unlockAchievement(userId: string, code: string): Promise<void> {
  const { error } = await supabase.from('achievement').upsert({ user_id: userId, code })
  if (error) throw error
}
