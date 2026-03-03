import { supabase } from '../lib/supabase'

export const goalsService = {
  async get(userId) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async upsert(userId, goals) {
    const { data, error } = await supabase
      .from('goals')
      .upsert({ user_id: userId, ...goals }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error
    return data
  }
}
