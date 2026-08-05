import { supabase } from '@/lib/supabase/client'

const BUCKET_NAME = 'ticket-images'

export const storageService = {
  async uploadImage(file: File): Promise<{ url: string | null; error: string | null }> {
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (error) {
      return { url: null, error: error.message }
    }
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName)
    return { url: data.publicUrl, error: null }
  },
}
