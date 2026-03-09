import { supabase } from '../lib/supabase'
import { storageService } from './storage'

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

  async createEntry(userId, { date, meal_type, emotion, note, photo }) {
    if (!photo || (typeof File !== 'undefined' && !(photo instanceof File))) {
      throw new Error('La foto es obligatoria')
    }

    const { data: entry, error: entryError } = await supabase
      .from('meal_entries')
      .insert({ user_id: userId, date, meal_type, emotion, note })
      .select()
      .single()

    if (entryError) throw entryError

    const photoUrl = await storageService.uploadMealPhoto(userId, entry.id, photo)
    await supabase.from('meal_entries').update({ photo_url: photoUrl }).eq('id', entry.id)
    entry.photo_url = photoUrl

    return entry
  },

  async updateEntry(entryId, { date, meal_type, emotion, note, photo }) {
    const updateData = { emotion: emotion || null, note: note || null }
    if (date) updateData.date = date
    if (meal_type) updateData.meal_type = meal_type
    const { error: entryError } = await supabase
      .from('meal_entries')
      .update(updateData)
      .eq('id', entryId)

    if (entryError) throw entryError

    const { data: entry } = await supabase.from('meal_entries').select('user_id').eq('id', entryId).single()
    if (photo && entry?.user_id && typeof File !== 'undefined' && photo instanceof File) {
      const photoUrl = await storageService.uploadMealPhoto(entry.user_id, entryId, photo)
      await supabase.from('meal_entries').update({ photo_url: photoUrl }).eq('id', entryId)
    }

    return { id: entryId }
  },

  async deleteEntry(entryId) {
    const { error } = await supabase.from('meal_entries').delete().eq('id', entryId)
    if (error) throw error
  },

  async getLastEntry(userId) {
    const { data, error } = await supabase
      .from('meal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data
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
