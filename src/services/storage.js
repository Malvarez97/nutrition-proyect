import { supabase } from '../lib/supabase'

const BUCKET_NAME = 'fotos-semanales'

export const storageService = {
  async uploadPhoto(file, path, upsert = true) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert
      })
    if (error) throw error
    return data
  },

  async uploadWeeklyPhoto(userId, date, type, file) {
    const ext = file.name?.split('.').pop() || 'jpg'
    const path = `${userId}/${date}/${type}.${ext}`
    const result = await this.uploadPhoto(file, path)
    return this.getPublicUrl(result.path)
  },

  getPublicUrl(path) {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)
    return data.publicUrl
  },

  async getSignedUrl(path, expiresIn = 3600) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn)
    if (error) throw error
    return data.signedUrl
  }
}
