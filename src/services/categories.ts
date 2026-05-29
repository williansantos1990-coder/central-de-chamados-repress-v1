import { supabase } from '@/lib/supabase/client'

export type Category = { id: string; name: string }

export const categoryService = {
  async getCategories() {
    const { data, error } = await supabase.from('categories').select('*').order('name')
    return { data: data as unknown as Category[], error }
  },
}
