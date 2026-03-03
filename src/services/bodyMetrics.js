import { supabase } from '../lib/supabase'

export const bodyMetricsService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('body_metrics')
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
      .from('body_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async upsert(userId, date, metrics) {
    const existing = await this.getByDate(userId, date)
    const payload = { user_id: userId, date, ...metrics }
    if (existing) {
      const { data, error } = await supabase
        .from('body_metrics')
        .update(metrics)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return data
    }
    return this.create(userId, date, metrics)
  },

  async create(userId, date, metrics) {
    const { data, error } = await supabase
      .from('body_metrics')
      .insert({ user_id: userId, date, ...metrics })
      .select()
      .single()

    if (error) throw error
    return data
  }
}
