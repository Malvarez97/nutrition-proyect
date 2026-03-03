import { supabase } from '../lib/supabase'

export const weeklyControlsService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('weekly_controls')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getByWeek(userId, weekStartDate) {
    return this.getByDate(userId, weekStartDate)
  },

  async getByDate(userId, date) {
    const { data, error } = await supabase
      .from('weekly_controls')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async upsert(userId, date, payload) {
    const existing = await this.getByDate(userId, date)
    const full = { user_id: userId, date, ...payload }
    if (existing) {
      const { data, error } = await supabase
        .from('weekly_controls')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return data
    }
    return this.create(userId, date, payload)
  },

  async create(userId, date, payload) {
    const { data, error } = await supabase
      .from('weekly_controls')
      .insert({ user_id: userId, date, ...payload })
      .select()
      .single()

    if (error) throw error
    return data
  }
}
