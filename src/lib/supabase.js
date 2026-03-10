import { createClient } from '@supabase/supabase-js'

// Vite inlines env vars at build time. En local: .env. En Vercel: Environment Variables del proyecto.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || ''

if (!supabaseUrl || !supabaseAnonKey) {
  const msg =
    'Faltan variables de Supabase. En local crea un .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. ' +
    'En Vercel: Project → Settings → Environment Variables y añade las mismas.'
  console.error(msg)
  throw new Error(msg)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
