import { supabase } from '../lib/supabase'

export const foodsService = {
  async getAvailableFoods() {
    const { data, error } = await supabase
      .from('foods')
      .select('id, name, category, calories, macros')
      .order('name')

    if (error) throw error
    return data || []
  }
}
