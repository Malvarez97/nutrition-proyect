import { supabase } from '../lib/supabase'

export const mealsService = {
  async getEntriesByDateRange(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('meal_entries')
      .select(`
        *,
        meal_foods (
          id,
          food_id,
          custom_name,
          quantity,
          foods (id, name, calories, macros, category)
        )
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  async createEntry(userId, { date, meal_type, emotion, note }, foods) {
    const { data: entry, error: entryError } = await supabase
      .from('meal_entries')
      .insert({ user_id: userId, date, meal_type, emotion, note })
      .select()
      .single()

    if (entryError) throw entryError

    if (foods?.length) {
      const mealFoods = foods.map((f) => ({
        meal_entry_id: entry.id,
        food_id: f.food_id || null,
        custom_name: f.custom_name || null,
        quantity: f.quantity ?? 1
      }))
      const { error: foodsError } = await supabase.from('meal_foods').insert(mealFoods)
      if (foodsError) throw foodsError
    }

    return entry
  },

  async updateEntry(entryId, { date, meal_type, emotion, note }, foods) {
    const updateData = { emotion: emotion || null, note: note || null }
    if (date) updateData.date = date
    if (meal_type) updateData.meal_type = meal_type
    const { error: entryError } = await supabase
      .from('meal_entries')
      .update(updateData)
      .eq('id', entryId)

    if (entryError) throw entryError

    await supabase.from('meal_foods').delete().eq('meal_entry_id', entryId)
    if (foods?.length) {
      const mealFoods = foods.map((f) => ({
        meal_entry_id: entryId,
        food_id: f.food_id || null,
        custom_name: f.custom_name || null,
        quantity: f.quantity ?? 1
      }))
      await supabase.from('meal_foods').insert(mealFoods)
    }

    return { id: entryId }
  },

  async deleteEntry(entryId) {
    const { error } = await supabase.from('meal_entries').delete().eq('id', entryId)
    if (error) throw error
  },

  async getDatesWithEntries(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('meal_entries')
      .select('date')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)

    if (error) throw error
    return [...new Set((data || []).map((r) => r.date))]
  }
}
