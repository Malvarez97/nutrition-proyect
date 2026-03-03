import { supabase } from '../lib/supabase'

export const feedbacksService = {
  async getForUser(userId) {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('user_id', userId)
      .order('week_date', { ascending: false })

    if (error) throw error
    return data || []
  },

  async respond(feedbackId, userId, response) {
    const { error } = await supabase
      .from('feedbacks')
      .update({
        user_response: response,
        user_responded_at: new Date().toISOString()
      })
      .eq('id', feedbackId)
      .eq('user_id', userId)

    if (error) throw error
  }
}
