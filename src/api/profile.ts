import { supabase } from '../lib/supabaseClient'

export interface Profile {
  user_id: string
  xp: number
  level: number
  streak: number
  longest_streak: number
  last_study_date: string | null
  daily_goal: number
  new_cards_per_day: number
  sound_enabled: boolean
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profile').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function ensureProfile(userId: string): Promise<Profile> {
  const existing = await getProfile(userId)
  if (existing) return existing

  const { data, error } = await supabase
    .from('profile')
    .insert({ user_id: userId })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(userId: string, patch: Partial<Omit<Profile, 'user_id'>>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profile')
    .update(patch)
    .eq('user_id', userId)
    .select('*')
    .single()
  if (error) throw error
  return data
}
