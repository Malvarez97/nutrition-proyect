import { supabase } from '../lib/supabase'

export const plansService = {
  async getByProfessional(professionalId) {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('professional_id', professionalId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(professionalId, title, version = '1.0') {
    const { data, error } = await supabase
      .from('plans')
      .insert({ professional_id: professionalId, title, version })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateVersion(planId, version) {
    const { data, error } = await supabase
      .from('plans')
      .update({ version, updated_at: new Date().toISOString() })
      .eq('id', planId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async assignUser(planId, userId) {
    const { error } = await supabase.from('plan_assignments').insert({
      plan_id: planId,
      user_id: userId
    })

    if (error) throw error
  },

  async unassignUser(planId, userId) {
    const { error } = await supabase
      .from('plan_assignments')
      .delete()
      .eq('plan_id', planId)
      .eq('user_id', userId)

    if (error) throw error
  },

  async getAssignments(planId) {
    const { data, error } = await supabase
      .from('plan_assignments')
      .select(`
        user_id,
        profiles (id, name, email)
      `)
      .eq('plan_id', planId)

    if (error) throw error
    return data || []
  }
}
