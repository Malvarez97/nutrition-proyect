import { supabase } from '../lib/supabase'

export const profilesService = {
  async update(userId, data) {
    const { data: result, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return result
  }
}
